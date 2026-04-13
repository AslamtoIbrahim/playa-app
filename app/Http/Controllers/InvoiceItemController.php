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
     */
    public function store(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'item_id'    => 'required|exists:items,id',
            'boat_id'    => 'required|exists:boats,id',
            'unit_count' => 'required|numeric',
            'unit_price' => 'required|numeric',
            'weight'     => 'nullable|numeric',
            'unit'       => 'nullable|string',
        ]);

        // الحساب الموحد (باش نضمنوا الـ amount يدوز صحيص للـ Database)
        $rowAmount = floatval($validated['unit_count']) * floatval($validated['unit_price']);

        DB::transaction(function () use ($invoice, $validated, $rowAmount) {
            // كنجيبو آخر بوزيسيون باش نزيدو عليها 1
            $maxPosition = $invoice->items()->max('position') ?? 0;

            $invoice->items()->create([
                'item_id'    => $validated['item_id'],
                'boat_id'    => $validated['boat_id'],
                'unit'       => $validated['unit'] ?? 'caisse',
                'unit_count' => $validated['unit_count'],
                'unit_price' => $validated['unit_price'],
                'weight'     => $validated['weight'] ?? 0,
                'amount'     => $rowAmount,
                'position'   => $maxPosition + 1,
            ]);

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
            'position'   => 'nullable|integer',
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
                'position'   => $validated['position'] ?? $item->position,
            ]);

            $invoice->refresh();
            $invoice->calculateTotals();
        });

        return back();
    }

    /**
     * ترتيب السطور (Drag & Drop)
     */
    public function reorder(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*' => 'exists:invoice_items,id'
        ]);

        DB::transaction(function () use ($validated, $invoice) {
            foreach ($validated['items'] as $index => $id) {
                InvoiceItem::where('id', $id)
                    ->where('invoice_id', $invoice->id)
                    ->update(['position' => $index]);
            }
        });

        return back()->with('success', 'Ordre mis à jour ✅');
    }

    /**
     * حذف سطر من الفاتورة
     */
    public function destroy(Invoice $invoice, InvoiceItem $item)
    {
        try {
            DB::transaction(function () use ($invoice, $item) {
                $item->delete();
                $invoice->refresh();
                $invoice->calculateTotals();
            });

            return back()->with('success', 'La ligne a été supprimée. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }
}