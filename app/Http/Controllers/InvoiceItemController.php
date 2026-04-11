<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceItemController extends Controller
{
    /**
     * إضافة سطر جديد للفاتورة
     * المنطق الجديد: Amount = Unit Count * Unit Price
     */
    public function store(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'item_id'    => 'required|exists:items,id',
            'boat_id'    => 'required|exists:boats,id',
            'unit_count' => 'required|numeric', // الوزن إلا كان kg، أو عدد الصناديق إلا كان caisse
            'unit_price' => 'required|numeric',
            'weight'     => 'nullable|numeric',
            'unit'       => 'nullable|string', // 'kg' أو 'caisse'
        ]);

        // الحساب الموحد
        $rowAmount = floatval($validated['unit_count']) * floatval($validated['unit_price']);

        DB::transaction(function () use ($invoice, $validated, $rowAmount) {
            $invoice->items()->create([
                'item_id'    => $validated['item_id'],
                'boat_id'    => $validated['boat_id'],
                'unit'       => $validated['unit'] ?? 'caisse',
                'unit_count' => $validated['unit_count'],
                'unit_price' => $validated['unit_price'],
                'weight'     => $validated['weight'] ?? 0,
                'amount'     => $rowAmount,
            ]);

            // تحديث إجماليات الفاتورة (TVA, Net à Payer, etc.)
            $invoice->refresh();
            $invoice->calculateTotals();
        });

        return back();
    }

    /**
     * تحديث سطر موجود
     */
    public function update(Request $request, Invoice $invoice, InvoiceItem $item)
    {
        $validated = $request->validate([
            'item_id'    => 'required|exists:items,id',
            'boat_id'    => 'required|exists:boats,id',
            'unit_count' => 'required|numeric',
            'unit_price' => 'required|numeric',
            'weight'     => 'nullable|numeric',
            'unit'       => 'nullable|string',
        ]);

        $rowAmount = floatval($validated['unit_count']) * floatval($validated['unit_price']);

        DB::transaction(function () use ($item, $invoice, $validated, $rowAmount) {
            $item->update([
                'item_id'    => $validated['item_id'],
                'boat_id'    => $validated['boat_id'],
                'unit'       => $validated['unit'] ?? 'caisse',
                'unit_count' => $validated['unit_count'],
                'unit_price' => $validated['unit_price'],
                'weight'     => $validated['weight'] ?? 0,
                'amount'     => $rowAmount,
            ]);

            $invoice->refresh();
            $invoice->calculateTotals();
        });

        return back();
    }

    /**
     * حذف سطر من الفاتورة
     */
    public function destroy(Invoice $invoice, InvoiceItem $item)
    {
        try {
            DB::transaction(function () use ($invoice, $item) {
                // 1. مسح السطر (Soft Delete بفضل الموديل)
                $item->delete();

                // 2. تحديث الحسابات ديال الفاتورة الأم
                // ضروري تدير refresh باش Laravel يعرف أن السطر تمسح وما يحسبوش
                $invoice->refresh();
                $invoice->calculateTotals();
            });

            return back()->with('success', 'La ligne a été supprimée et le total mis à jour. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la suppression de la ligne.');
        }
    }
}
