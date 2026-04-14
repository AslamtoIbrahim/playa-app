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
