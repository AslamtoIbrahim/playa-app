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
            'boat_id'    => 'nullable|exists:boats,id',
            'item_id'    => 'nullable|exists:items,id',
            'unit_count' => 'nullable|numeric',
            'unit_price' => 'nullable|numeric',
            'weight'     => 'nullable|numeric',
            'unit'       => 'nullable|string',
            'target_id'  => 'nullable|exists:invoice_items,id',
            'direction'  => 'nullable|in:above,below',
        ]);

        $unitCount = floatval($validated['unit_count'] ?? 0);
        $unitPrice = floatval($validated['unit_price'] ?? 0);
        $rowAmount = $unitCount * $unitPrice;

        DB::transaction(function () use ($request, $invoice, $validated, $rowAmount, $unitCount, $unitPrice) {
            $position = 0;

            if ($request->filled('target_id') && $request->filled('direction')) {
                $targetItem = \App\Models\InvoiceItem::findOrFail($validated['target_id']);

                if ($validated['direction'] === 'above') {
                    $position = $targetItem->position;
                    $invoice->items()->where('position', '>=', $position)->increment('position');
                } else {
                    $position = $targetItem->position + 1;
                    $invoice->items()->where('position', '>=', $position)->increment('position');
                }
            } else {
                // --- التعديل هنا ---
                // السطر الجديد غاياخد Position 0 (يعني لفوق كاع)
                $position = 0;

                // دفع كاع السطور اللي كاينين حالياً بـ +1 لتحت باش نخويو رقم 0 للسطر الجديد
                $invoice->items()->increment('position');
            }

            $invoice->items()->create([
                'boat_id'    => $validated['boat_id'] ?? null,
                'item_id'    => $validated['item_id'] ?? null,
                'unit'       => $validated['unit'] ?? 'caisse',
                'unit_count' => $unitCount,
                'unit_price' => $unitPrice,
                'weight'     => floatval($validated['weight'] ?? 0),
                'amount'     => $rowAmount,
                'position'   => $position,
            ]);

            $invoice->refresh();
            $invoice->calculateTotals();
        });

        return back();
    }


    /**
     * تكرار عدة سطور مختارة
     */
    public function duplicateMany(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:invoice_items,id'
        ]);

        try {
            DB::transaction(function () use ($invoice, $validated) {
                // 1. جيب السطور اللي بغينا نذوبلو مرتبين حسب البوزيسيون ديالهم
                $itemsToDuplicate = $invoice->items()
                    ->whereIn('id', $validated['ids'])
                    ->orderBy('position', 'asc')
                    ->get();

                if ($itemsToDuplicate->isEmpty()) return;

                // 2. حدد أكبر بوزيسيون في السطور المختارة (باش نحطو تحتها)
                $lastSelectedPosition = $itemsToDuplicate->max('position');
                $count = $itemsToDuplicate->count();

                // 3. "دفع" كاع السطور اللي كاينين تحت هاد البوزيسيون بـ $count
                // باش نخويو بلاصة للنسخ الجداد
                $invoice->items()
                    ->where('position', '>', $lastSelectedPosition)
                    ->increment('position', $count);

                // 4. كريي النسخ الجداد في البلاصة اللي خوينا
                foreach ($itemsToDuplicate as $index => $item) {
                    $newItem = $item->replicate();
                    // كياخد البوزيسيون اللي مباشرة تحت آخر واحد سيلكتينا
                    $newItem->position = $lastSelectedPosition + ($index + 1);
                    $newItem->save();
                }

                $invoice->refresh();
                $invoice->calculateTotals();
            });

            return back()->with('success', 'Lignes dupliquées avec succès.');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la duplication.');
        }
    }

    /**
     * تحديث سطر موجود
     */
    public function update(Request $request, Invoice $invoice, InvoiceItem $item)
    {
        // 1. ردينا كلشي nullable باش يقبل التعديلات الجزئية
        $validated = $request->validate([
            'item_id'    => 'nullable|exists:items,id',
            'boat_id'    => 'nullable|exists:boats,id',
            'unit_count' => 'nullable|numeric',
            'unit_price' => 'nullable|numeric',
            'weight'     => 'nullable|numeric',
            'unit'       => 'nullable|string',
            'position'   => 'nullable|integer',
        ]);

        // 2. حساب الـ Amount مع معالجة القيم الفارغة (حيت يقدر يكون واحد فيهم null)
        $unitCount = floatval($validated['unit_count'] ?? $item->unit_count ?? 0);
        $unitPrice = floatval($validated['unit_price'] ?? $item->unit_price ?? 0);
        $rowAmount = $unitCount * $unitPrice;

        DB::transaction(function () use ($item, $invoice, $validated, $rowAmount) {
            $item->update([
                'item_id'    => $validated['item_id'] ?? $item->item_id,
                'boat_id'    => $validated['boat_id'] ?? $item->boat_id,
                'unit'       => $validated['unit'] ?? $item->unit ?? 'caisse',
                'unit_count' => $validated['unit_count'] ?? $item->unit_count ?? 0,
                'unit_price' => $validated['unit_price'] ?? $item->unit_price ?? 0,
                'weight'     => $validated['weight'] ?? $item->weight ?? 0,
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




    /**
     * حذف عدة سطور دفعة واحدة
     */
    public function destroyMany(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:invoice_items,id'
        ]);

        try {
            DB::transaction(function () use ($invoice, $validated) {
                // حذف السطور المختارة المرتبطة حصراً بهاد الفاتورة (أمان إضافي)
                $invoice->items()->whereIn('id', $validated['ids'])->delete();

                // تحديث الحسابات الإجمالية للفاتورة
                $invoice->refresh();
                $invoice->calculateTotals();
            });

            return back()->with('success', count($validated['ids']) . ' lignes supprimées. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la suppression groupée.');
        }
    }
}
