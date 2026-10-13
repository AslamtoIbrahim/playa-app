<?php

namespace App\Http\Controllers;

use App\Models\Difference;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Distribution des lignes de facture d'achat vers les ventes.
 *
 * La quantité, le prix et l'écart viennent de la ligne `Difference`, tandis
 * que le client est celui de la vente choisie. Aucun écart de vente n'est recalculé.
 */
class SaleItemController extends Controller
{
    /**
     * 1. Associer une ligne de répartition à une vente de la même journée.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'difference_id' => 'required|exists:differences,id',
        ]);

        return DB::transaction(function () use ($validated) {
            $sale = Sale::findOrFail($validated['sale_id']);

            // Lock the source row so simultaneous requests cannot sell it twice.
            $difference = Difference::with('invoiceItem.invoice.sessionZone')
                ->lockForUpdate()
                ->findOrFail($validated['difference_id']);
            $invoiceItem = $difference->invoiceItem;

            if (! $invoiceItem) {
                return back()->with('error', 'Cette répartition ne dépend pas d’une ligne de facture.');
            }

            // La vente doit appartenir à la même journée que la facture d'achat.
            $invoiceSessionId = $invoiceItem->invoice?->sessionZone?->daily_session_id;

            if ($invoiceSessionId === null || (int) $sale->session_id !== (int) $invoiceSessionId) {
                return back()->with('error', 'La vente doit appartenir à la même journée que la facture.');
            }

            if ($difference->saleItems()->exists()) {
                return back()->with('error', 'Cette répartition est déjà vendue.');
            }

            $invoiceItem->saleItems()->create([
                'sale_id' => $sale->id,
                'difference_id' => $difference->id,
            ]);

            return back()->with([
                'success' => 'Vente enregistrée ! ✅',
                'updated_item' => $invoiceItem->fresh()->load('saleItems.sale.customer'),
            ]);
        });
    }

    /**
     * 2. Move a sold difference row between sales in the same session.
     *
     * The sale's customer is chosen independently; quantities and prices come
     * from the linked difference.
     */
    public function update(Request $request, SaleItem $saleItem)
    {
        $validated = $request->validate([
            'sale_id' => 'sometimes|integer|exists:sales,id',
        ], [
            'sale_id.integer' => "L'identifiant de vente est invalide.",
            'sale_id.exists' => "Cette vente n'existe pas.",
        ]);

        return DB::transaction(function () use ($validated, $saleItem) {
            $invoiceItem = $saleItem->invoiceItem;

            $previousSaleId = (int) $saleItem->sale_id;
            $targetSaleId = isset($validated['sale_id']) ? (int) $validated['sale_id'] : null;

            // Client switch: moving the line to another sale is only allowed
            // when that sale shares the session of the source invoice line.
            if ($targetSaleId !== null && $targetSaleId !== $previousSaleId) {
                $sale = Sale::findOrFail($targetSaleId);

                $invoiceSessionId = $invoiceItem?->invoice?->sessionZone?->daily_session_id;

                if ($invoiceSessionId === null || (int) $sale->session_id !== (int) $invoiceSessionId) {
                    return back()->with('error', 'La vente doit appartenir à la même journée que la facture.');
                }
            }

            // Reset the relation so the `saved` hook targets the new sale.
            $saleItem->unsetRelation('sale');

            $saleItem->update([
                'sale_id' => $targetSaleId ?? $saleItem->sale_id,
            ]);

            // The `saved` hook recomputed the target sale: when the line moved,
            // the previous sale must drop it from its totals as well.
            if ($targetSaleId !== null && $targetSaleId !== $previousSaleId) {
                Sale::find($previousSaleId)?->calculateTotals();
            }

            return back()->with('success', 'Ligne mise à jour.');
        });
    }

    /**
     * 3. Remove the sale assignment so this difference can be sold again.
     */
    public function destroy(SaleItem $saleItem)
    {
        $invoiceItem = $saleItem->invoiceItem;

        $saleItem->delete();

        return back()->with([
            'success' => 'Supprimée ! ✅',
            'updated_item' => $invoiceItem?->fresh()->load('saleItems.sale.customer'),
        ]);
    }
}
