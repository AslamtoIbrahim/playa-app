<?php

namespace App\Http\Controllers;

use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleCharge;
use Illuminate\Database\QueryException;
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
            'amount' => 'required|numeric|min:0.01',
        ], [
            'sale_id.required' => 'Veuillez choisir une vente.',
            'sale_id.exists' => "Cette vente n'existe pas.",
            'receipt_id.required' => 'Le bon est obligatoire.',
            'receipt_id.exists' => "Ce bon n'existe pas.",
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

            // Active duplicate -> friendly error instead of 500.
            $exists = SaleCharge::where('sale_id', $sale->id)->where('receipt_id', $receipt->id)->exists();

            if ($exists) {
                return back()->with('error', 'Ce bon est déjà imputé à cette vente.');
            }

            // Soft-deleted rows still occupy the UNIQUE(sale_id, receipt_id)
            // index, so purge only trashed rows before re-using the pair.
            SaleCharge::onlyTrashed()
                ->where('sale_id', $sale->id)
                ->where('receipt_id', $receipt->id)
                ->forceDelete();

            $distributed = (float) $receipt->saleCharges()->sum('amount');
            $remaining = (float) $receipt->total_amount - $distributed;

            if ($remaining <= 0) {
                return back()->with('error', 'Ce bon est entièrement vendu.');
            }

            if ((float) $validated['amount'] > $remaining) {
                return back()->with('error', "Montant insuffisant ! Max: $remaining");
            }

            try {
                $receipt->saleCharges()->create([
                    'sale_id' => $sale->id,
                    'amount' => $validated['amount'],
                ]);
            } catch (QueryException $e) {
                // Race condition on the UNIQUE(sale_id, receipt_id) index.
                return back()->with('error', 'Ce bon est déjà imputé à cette vente.');
            }

            return back()->with([
                'success' => 'Bon imputé à la vente !',
                'updated_receipt' => $receipt->fresh()->load('saleCharges.sale.customer'),
            ]);
        });
    }

    public function update(Request $request, SaleCharge $saleCharge)
    {
        $validated = $request->validate([
            'sale_id' => 'sometimes|integer|exists:sales,id',
            'amount' => 'nullable|numeric|min:0.01',
        ], [
            'sale_id.integer' => "L'identifiant de vente est invalide.",
            'sale_id.exists' => "Cette vente n'existe pas.",
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
            $finalSaleId = $targetSaleId ?? $previousSaleId;

            // Soft-deleted rows still occupy the UNIQUE(sale_id, receipt_id)
            // index. Purge them first, otherwise even an amount-only update
            // that rewrites the same sale_id crashes with a 500.
            SaleCharge::onlyTrashed()
                ->where('sale_id', $finalSaleId)
                ->where('receipt_id', $saleCharge->receipt_id)
                ->forceDelete();

            if ($targetSaleId !== null && $targetSaleId !== $previousSaleId) {
                $sale = Sale::findOrFail($targetSaleId);
                $receiptSessionId = $receipt?->sessionZone?->daily_session_id;

                if ($receiptSessionId === null || (int) $sale->session_id !== (int) $receiptSessionId) {
                    return back()->with('error', 'La vente doit appartenir à la même journée que le bon.');
                }

                $duplicate = SaleCharge::where('sale_id', $targetSaleId)
                    ->where('receipt_id', $saleCharge->receipt_id)
                    ->exists();

                if ($duplicate) {
                    return back()->with('error', 'Ce bon est déjà imputé à cette vente.');
                }
            }

            $saleCharge->unsetRelation('sale');

            try {
                $saleCharge->update([
                    'sale_id' => $targetSaleId ?? $saleCharge->sale_id,
                    'amount' => $newAmount,
                ]);
            } catch (QueryException $e) {
                // Race condition on the UNIQUE(sale_id, receipt_id) index.
                return back()->with('error', 'Ce bon est déjà imputé à cette vente.');
            }

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
            'updated_receipt' => $receipt?->fresh()->load('saleCharges.sale.customer'),
        ]);
    }
}
