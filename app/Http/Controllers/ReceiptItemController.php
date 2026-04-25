<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReceiptItemController extends Controller
{
    /**
     * إضافة سطر جديد للوصل
     */
    public function store(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'item_id'    => 'nullable|exists:items,id',
            'unit_count' => 'required|numeric',
            'real_price' => 'required|numeric',
            'box'        => 'nullable|integer',
            'target_id'  => 'nullable|exists:receipt_items,id',
            'direction'  => 'nullable|in:above,below',
        ]);

        DB::transaction(function () use ($request, $receipt, $validated) {
            $position = 0;

            // منطق تحديد الترتيب (Position) إذا كان السطر مضافاً بين أسطر أخرى
            if ($request->filled('target_id') && $request->filled('direction')) {
                $targetItem = ReceiptItem::findOrFail($validated['target_id']);

                if ($validated['direction'] === 'above') {
                    $position = $targetItem->position;
                    $receipt->items()->where('position', '>=', $position)->increment('position');
                } else {
                    $position = $targetItem->position + 1;
                    $receipt->items()->where('position', '>=', $position)->increment('position');
                }
            } else {
                // إضافة في آخر القائمة
                $position = $receipt->items()->max('position') + 1;
            }

            $receipt->items()->create([
                'item_id'    => $validated['item_id'],
                'unit_count' => $validated['unit_count'],
                'real_price' => $validated['real_price'],
                'box'        => $validated['box'],
                'total_diff' => $validated['unit_count'] * $validated['real_price'],
                'position'   => $position,
            ]);
            $receipt->calculateTotals();

            // التحديثات الإجمالية كيديرها الموديل أوتوماتيكياً (Booted method)
        });

        return back()->with('success', 'Élément ajouté au bon.');
    }

    /**
     * تحديث سطر موجود
     */
    public function update(Request $request, Receipt $receipt, ReceiptItem $item)
    {
        $validated = $request->validate([
            'item_id'    => 'nullable|exists:items,id',
            'unit_count' => 'nullable|numeric',
            'real_price' => 'nullable|numeric',
            'box'        => 'nullable|integer',
            'position'   => 'nullable|integer',
        ]);

        DB::transaction(function () use ($item, $validated) {
            $unitCount = $validated['unit_count'] ?? $item->unit_count;
            $realPrice = $validated['real_price'] ?? $item->real_price;

            $item->update([
                'item_id'    => $validated['item_id'] ?? $item->item_id,
                'unit_count' => $unitCount,
                'real_price' => $realPrice,
                'box'        => $validated['box'] ?? $item->box,
                'total_diff' => $unitCount * $realPrice,
                'position'   => $validated['position'] ?? $item->position,
            ]);
            $item->receipt->calculateTotals();
        });

        return back()->with('success', 'Ligne mise à jour.');
    }

    /**
     * إضافة مجموعة سطور (Import)
     */
    public function bulkStore(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'items'              => 'required|array',
            'items.*.item_id'    => 'required|exists:items,id',
            'items.*.unit_count' => 'required|numeric',
            'items.*.real_price' => 'required|numeric',
            'items.*.box'        => 'required|integer',
        ]);

        try {
            DB::transaction(function () use ($receipt, $validated) {
                $lastPosition = $receipt->items()->max('position') ?? -1;

                foreach ($validated['items'] as $index => $itemData) {
                    $receipt->items()->create([
                        'item_id'    => $itemData['item_id'],
                        'unit_count' => $itemData['unit_count'],
                        'real_price' => $itemData['real_price'],
                        'box'        => $itemData['box'] ?? 0,
                        'total_diff' => $itemData['unit_count'] * $itemData['real_price'],
                        'position'   => $lastPosition + ($index + 1),
                    ]);
                }
                $receipt->calculateTotals();
                // تحديث المجاميع سيتم بعد الحفظ في الموديل
            });

            return back()->with('success', count($validated['items']) . ' articles importés.');
        } catch (\Exception $e) {
            return back()->with('error', "Erreur lors de l'importation.");
        }
    }

    /**
     * تكرار عدة سطور مختارة
     */
    public function duplicateMany(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:receipt_items,id'
        ]);

        try {
            DB::transaction(function () use ($receipt, $validated) {
                $itemsToDuplicate = $receipt->items()
                    ->whereIn('id', $validated['ids'])
                    ->orderBy('position', 'asc')
                    ->get();

                if ($itemsToDuplicate->isEmpty()) return;

                $maxSelectedPosition = $itemsToDuplicate->max('position');
                $count = $itemsToDuplicate->count();

                // إزاحة الأسطر التي تلي الأسطر المحددة
                $receipt->items()
                    ->where('position', '>', $maxSelectedPosition)
                    ->increment('position', $count);

                foreach ($itemsToDuplicate as $index => $item) {
                    $newItem = $item->replicate();
                    $newItem->position = $maxSelectedPosition + ($index + 1);
                    $newItem->save();
                }

                $receipt->calculateTotals();
            });

            return back()->with('success', 'Lignes dupliquées.');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la duplication.');
        }
    }

    /**
     * ترتيب السطور (Drag & Drop)
     */
    public function reorder(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'items'   => 'required|array',
            'items.*' => 'exists:receipt_items,id'
        ]);

        DB::transaction(function () use ($validated, $receipt) {
            foreach ($validated['items'] as $index => $id) {
                ReceiptItem::where('id', $id)
                    ->where('receipt_id', $receipt->id)
                    ->update(['position' => $index]);
            }
        });

        return back()->with('success', 'Ordre mis à jour ✅');
    }

    /**
     * حذف سطر
     */
    public function destroy(Receipt $receipt, ReceiptItem $item)
    {
        DB::transaction(function () use ($item) {
            $item->delete();
        });

        $receipt->calculateTotals();

        return back()->with('success', 'Ligne supprimée. ✅');
    }

    /**
     * حذف مجموعة سطور
     */
    public function destroyMany(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer|exists:receipt_items,id'
        ]);

        try {
            DB::transaction(function () use ($receipt, $validated) {
                $receipt->items()->whereIn('id', $validated['ids'])->delete();
            });

            $receipt->calculateTotals();

            return back()->with('success', count($validated['ids']) . ' supprimés. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }
}