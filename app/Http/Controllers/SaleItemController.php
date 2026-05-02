<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleItemController extends Controller
{
    /**
     * 1. إضافة سطر جديد (Single Store)
     */
    public function store(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'boat_id'    => 'nullable|exists:boats,id',
            'item_id'    => 'nullable|exists:items,id',
            'unit_count' => 'required|numeric',
            'unit_price' => 'required|numeric',
            'weight'     => 'nullable|numeric',
            'unit'       => 'nullable|string',
            'box'        => 'nullable|integer',
            'target_id'  => 'nullable|exists:sale_items,id',
            'direction'  => 'nullable|in:above,below',
        ]);

        DB::transaction(function () use ($request, $sale, $validated) {
            $position = 0;

            if ($request->filled('target_id') && $request->filled('direction')) {
                $targetItem = SaleItem::findOrFail($validated['target_id']);
                $position = ($validated['direction'] === 'above') ? $targetItem->position : $targetItem->position + 1;
                $sale->items()->where('position', '>=', $position)->increment('position');
            } else {
                $position = ($sale->items()->max('position') ?? -1) + 1;
            }

            $sale->items()->create(array_merge($validated, ['position' => $position]));
            
            // L-Model boot method gha t-calculi l-totals bouhdha
        });

        return back()->with('success', 'Ligne ajoutée.');
    }

    /**
     * 2. تحديث سطر (Update)
     */
    public function update(Request $request, Sale $sale, SaleItem $item)
    {
        $validated = $request->validate([
            'item_id'    => 'nullable|exists:items,id',
            'boat_id'    => 'nullable|exists:boats,id',
            'unit_count' => 'nullable|numeric',
            'unit_price' => 'nullable|numeric',
            'weight'     => 'nullable|numeric',
            'unit'       => 'nullable|string',
            'box'        => 'nullable|integer',
        ]);

        $item->update($validated);

        return back()->with('success', 'Ligne mise à jour.');
    }

    /**
     * 3. إضافة مجموعة سطور (Bulk Store)
     */
    public function bulkStore(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.boat_id'    => 'nullable|exists:boats,id',
            'items.*.item_id'    => 'nullable|exists:items,id',
            'items.*.unit_count' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric',
            'items.*.unit'       => 'required|string',
            'items.*.box'        => 'nullable|integer',
            'items.*.weight'     => 'nullable|numeric',
        ]);

        DB::transaction(function () use ($sale, $validated) {
            $lastPosition = $sale->items()->max('position') ?? -1;

            foreach ($validated['items'] as $index => $itemData) {
                $sale->items()->create(array_merge($itemData, [
                    'position' => $lastPosition + ($index + 1)
                ]));
            }
        });

        return back()->with('success', 'Articles importés.');
    }

    /**
     * 4. تكرار السطور (Duplicate Many)
     */
    public function duplicateMany(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:sale_items,id'
        ]);

        DB::transaction(function () use ($sale, $validated) {
            $items = $sale->items()->whereIn('id', $validated['ids'])->orderBy('position', 'asc')->get();
            $lastPos = $items->max('position');
            
            $sale->items()->where('position', '>', $lastPos)->increment('position', $items->count());

            foreach ($items as $index => $item) {
                $newItem = $item->replicate();
                $newItem->position = $lastPos + ($index + 1);
                $newItem->save();
            }
        });

        return back()->with('success', 'Lignes dupliquées.');
    }

    /**
     * 5. ترتيب السطور (Reorder)
     */
    public function reorder(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*' => 'exists:sale_items,id'
        ]);

        DB::transaction(function () use ($validated, $sale) {
            foreach ($validated['items'] as $index => $id) {
                $sale->items()->where('id', $id)->update(['position' => $index]);
            }
        });

        return back()->with('success', 'Ordre mis à jour.');
    }

    /**
     * 6. حذف سطر (Destroy)
     */
    public function destroy(Sale $sale, SaleItem $item)
    {
        $item->delete(); // L-Model hook gha i-update l-totals
        return back()->with('success', 'Ligne supprimée.');
    }

    /**
     * 7. حذف مجموعة سطور (Destroy Many)
     */
    public function destroyMany(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:sale_items,id'
        ]);

        $sale->items()->whereIn('id', $validated['ids'])->delete();
        
        $sale->refresh();
        $sale->calculateTotals();

        return back()->with('success', 'Lignes supprimées.');
    }
}