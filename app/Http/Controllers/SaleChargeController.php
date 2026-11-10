<?php

namespace App\Http\Controllers;

use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleCharge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Imputation des bons de réception vers les ventes.
 */
class SaleChargeController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'receipt_id' => 'required|exists:receipts,id',
            'category_id' => 'nullable|integer|exists:categories,id',
            'amount' => 'required|numeric|min:0.01',
        ], [
            'sale_id.required' => 'Veuillez choisir une vente.',
            'sale_id.exists' => "Cette vente n'existe pas.",
            'receipt_id.required' => 'Le bon est obligatoire.',
            'receipt_id.exists' => "Ce bon n'existe pas.",
            'category_id.exists' => "Cette catégorie n'existe pas.",
            'amount.required' => 'Le montant est obligatoire.',
            'amount.numeric' => 'Le montant doit être un nombre.',
            'amount.min' => 'Le montant doit être au moins 0.01.',
        ]);

        return DB::transaction(function () use ($validated) {
            $sale = Sale::findOrFail($validated['sale_id']);
            $receipt = Receipt::with('sessionZone')->lockForUpdate()->findOrFail($validated['receipt_id']);
            $receiptSessionId = $receipt->sessionZone?->daily_session_id;

            if ($receiptSessionId === null || (int) $sale->session_id !== (int) $receiptSessionId) {
                return back()->with('error', 'La vente doit appartenir à la même journée que le bon.');
            }

            if ($sale->session?->status === 'closed') {
                return back()->with('error', 'Action impossible : La session est clôturée.');
            }

            $distributed = (float) $receipt->saleCharges()->sum('amount');
            $remaining = (float) $receipt->total_amount - $distributed;

            if ($remaining <= 0) {
                return back()->with('error', 'Ce bon est entièrement vendu.');
            }

            if ((float) $validated['amount'] > $remaining) {
                return back()->with('error', "Montant insuffisant ! Max: $remaining");
            }

            $receipt->saleCharges()->create([
                'sale_id' => $sale->id,
                'category_id' => $validated['category_id'] ?? null,
                'amount' => $validated['amount'],
            ]);

            return back()->with([
                'success' => 'Bon imputé à la vente !',
                'updated_receipt' => $receipt->fresh()->load('saleCharges.category', 'saleCharges.sale.owner'),
            ]);
        });
    }

    public function update(Request $request, SaleCharge $saleCharge)
    {
        $validated = $request->validate([
            'sale_id' => 'sometimes|integer|exists:sales,id',
            'category_id' => 'sometimes|nullable|integer|exists:categories,id',
            'amount' => 'nullable|numeric|min:0.01',
        ], [
            'sale_id.integer' => "L'identifiant de vente est invalide.",
            'sale_id.exists' => "Cette vente n'existe pas.",
            'category_id.integer' => "L'identifiant de catégorie est invalide.",
            'category_id.exists' => "Cette catégorie n'existe pas.",
            'amount.numeric' => 'Le montant doit être un nombre.',
            'amount.min' => 'Le montant doit être au moins 0.01.',
        ]);

        return DB::transaction(function () use ($validated, $saleCharge) {
            $receipt = $saleCharge->receipt;
            $newAmount = isset($validated['amount']) ? (float) $validated['amount'] : (float) $saleCharge->amount;

            if ($receipt) {
                $other = (float) $receipt->saleCharges()->where('id', '!=', $saleCharge->id)->sum('amount');
                $remaining = (float) $receipt->total_amount - $other;

                if ($newAmount > $remaining) {
                    return back()->with('error', "Montant insuffisant ! Max: $remaining");
                }
            }

            $previousSaleId = (int) $saleCharge->sale_id;
            $targetSaleId = isset($validated['sale_id']) ? (int) $validated['sale_id'] : null;
            if ($targetSaleId !== null && $targetSaleId !== $previousSaleId) {
                $sale = Sale::findOrFail($targetSaleId);
                $receiptSessionId = $receipt?->sessionZone?->daily_session_id;

                if ($receiptSessionId === null || (int) $sale->session_id !== (int) $receiptSessionId) {
                    return back()->with('error', 'La vente doit appartenir à la même journée que le bon.');
                }

            }

            $saleCharge->unsetRelation('sale');

            $saleCharge->update([
                'sale_id' => $targetSaleId ?? $saleCharge->sale_id,
                'category_id' => array_key_exists('category_id', $validated)
                    ? $validated['category_id']
                    : $saleCharge->category_id,
                'amount' => $newAmount,
            ]);

            if ($targetSaleId !== null && $targetSaleId !== $previousSaleId) {
                Sale::find($previousSaleId)?->calculateTotals();
            }

            return back()->with('success', 'Charge mise à jour.');
        });
    }

    public function destroy(SaleCharge $saleCharge)
    {
        $receipt = $saleCharge->receipt;

        $saleCharge->delete();

        return back()->with([
            'success' => 'Supprimée !',
            'updated_receipt' => $receipt?->fresh()->load('saleCharges.category', 'saleCharges.sale.owner'),
        ]);
    }
}
