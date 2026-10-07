<?php

namespace App\Http\Controllers;

use App\Models\InvoiceItem;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Distribution des lignes de facture d'achat vers les ventes.
 *
 * Une ligne de facture peut être vendue en plusieurs fois, à des ventes
 * différentes (donc à des clients différents), jusqu'à épuisement de sa
 * quantité. Le prix réel de chaque vente génère son propre écart
 * (`total_diff`), indépendamment des différences de prix déjà réparties.
 */
class SaleItemController extends Controller
{
    /**
     * 1. Enregistrer la vente d'une (partie de) ligne de facture d'achat.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'invoice_item_id' => 'required|exists:invoice_items,id',
            'unit_count' => 'required|numeric|min:0.01',
            'real_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $sale = Sale::findOrFail($validated['sale_id']);

            // Row lock: concurrent submissions cannot exceed the remaining quantity.
            $invoiceItem = InvoiceItem::with('invoice.sessionZone')
                ->lockForUpdate()
                ->findOrFail($validated['invoice_item_id']);

            // La vente doit appartenir à la même journée que la facture d'achat.
            $invoiceSessionId = $invoiceItem->invoice?->sessionZone?->daily_session_id;

            if ($invoiceSessionId === null || (int) $sale->session_id !== (int) $invoiceSessionId) {
                return back()->with('error', 'La vente doit appartenir à la même journée que la facture.');
            }

            // La quantité vendable restante ne dépend que des ventes déjà faites :
            // les différences de prix restent une notion indépendante.
            $distributed = (float) $invoiceItem->saleItems()->sum('unit_count');

            $remaining = (float) $invoiceItem->unit_count - $distributed;

            if ((float) $validated['unit_count'] > $remaining) {
                return back()->with('error', "Quantité insuffisante ! Max: $remaining");
            }

            $invoiceItem->saleItems()->create([
                'sale_id' => $sale->id,
                'unit_count' => $validated['unit_count'],
                'real_price' => $validated['real_price'],
            ]);

            return back()->with([
                'success' => 'Vente enregistrée ! ✅',
                'updated_item' => $invoiceItem->fresh()->load('saleItems.sale.customer'),
            ]);
        });
    }

    /**
     * 2. Mettre à jour une distribution (quantité et/ou prix réel).
     */
    public function update(Request $request, SaleItem $saleItem)
    {
        $validated = $request->validate([
            'unit_count' => 'nullable|numeric|min:0.01',
            'real_price' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $saleItem) {
            $invoiceItem = $saleItem->invoiceItem;

            $newCount = $validated['unit_count'] ?? $saleItem->unit_count;

            if ($invoiceItem) {
                $otherDistributed = (float) $invoiceItem->saleItems()
                    ->where('id', '!=', $saleItem->id)
                    ->sum('unit_count');

                $remaining = (float) $invoiceItem->unit_count - $otherDistributed;

                if ((float) $newCount > $remaining) {
                    return back()->with('error', "Quantité insuffisante ! Max: $remaining");
                }
            }

            $saleItem->update([
                'unit_count' => $newCount,
                'real_price' => $validated['real_price'] ?? $saleItem->real_price,
            ]);

            return back()->with('success', 'Ligne mise à jour.');
        });
    }

    /**
     * 3. Supprimer une distribution (la quantité redevient vendable).
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
