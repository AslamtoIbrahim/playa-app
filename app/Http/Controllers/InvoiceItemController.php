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
            'box'        => 'nullable|integer', // Field jdid
            'target_id'  => 'nullable|exists:invoice_items,id',
            'direction'  => 'nullable|in:above,below',
        ]);

        $unitCount = floatval($validated['unit_count'] ?? 0);

        $unitPrice = floatval($validated['unit_price'] ?? 0);

        $rowAmount = $unitCount * $unitPrice;

        DB::transaction(function () use ($request, $invoice, $validated, $rowAmount, $unitCount, $unitPrice) {
            $position = 0;

            if ($request->filled('target_id') && $request->filled('direction')) {
                $targetItem = InvoiceItem::findOrFail($validated['target_id']);

                if ($validated['direction'] === 'above') {
                    $position = $targetItem->position;
                    $invoice->items()->where('position', '>=', $position)->increment('position');
                } else {
                    $position = $targetItem->position + 1;
                    $invoice->items()->where('position', '>=', $position)->increment('position');
                }
            } else {
                $position = 0;
                $invoice->items()->increment('position');
            }

            $invoice->items()->create([
                'boat_id'    => $validated['boat_id'] ?? null,
                'item_id'    => $validated['item_id'] ?? null,
                'unit'       => $validated['unit'] ?? 'caisse',
                'box'        => $validated['box'] ?? 0, // Added here
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
     * تحديث سطر موجود
     */
    public function update(Request $request, Invoice $invoice, InvoiceItem $item)
    {
        $validated = $request->validate([
            'item_id'    => 'nullable|exists:items,id',
            'boat_id'    => 'nullable|exists:boats,id',
            'unit_count' => 'nullable|numeric',
            'unit_price' => 'nullable|numeric',
            'weight'     => 'nullable|numeric',
            'unit'       => 'nullable|string',
            'box'        => 'nullable|integer', // Field jdid
            'position'   => 'nullable|integer',
        ]);

        $unitCount = floatval($validated['unit_count'] ?? $item->unit_count ?? 0);

        $unitPrice = floatval($validated['unit_price'] ?? $item->unit_price ?? 0);

        $rowAmount = $unitCount * $unitPrice;

        DB::transaction(function () use ($item, $invoice, $validated, $rowAmount) {
            $item->update([
                'item_id'    => $validated['item_id'] ?? $item->item_id,
                'boat_id'    => $validated['boat_id'] ?? $item->boat_id,
                'unit'       => $validated['unit'] ?? $item->unit ?? 'caisse',
                'box'        => $validated['box'] ?? $item->box ?? 0, // Added here
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
     * إضافة مجموعة سطور
     */
    public function bulkStore(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.boat_id' => 'nullable|exists:boats,id',
            'items.*.item_id' => 'nullable|exists:items,id',
            'items.*.unit_count' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric',
            'items.*.unit' => 'required|string',
            'items.*.box' => 'nullable|integer', // Field jdid
            'items.*.weight' => 'nullable|numeric',
        ]);

        try {
            DB::transaction(function () use ($invoice, $validated) {
                $lastPosition = $invoice->items()->max('position') ?? -1;

                $itemsData = collect($validated['items'])->map(function ($item, $index) use ($invoice, $lastPosition) {
                    return [
                        'invoice_id' => $invoice->id,
                        'boat_id'    => $item['boat_id'] ?? null,
                        'item_id'    => $item['item_id'] ?? null,
                        'unit'       => $item['unit'] ?? 'caisse',
                        'box'        => $item['box'] ?? 0, // Added here
                        'unit_count' => $item['unit_count'],
                        'unit_price' => $item['unit_price'],
                        'weight'     => $item['weight'] ?? 0,
                        'amount'     => $item['unit_count'] * $item['unit_price'],
                        'position'   => $lastPosition + ($index + 1),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                })->toArray();

                InvoiceItem::insert($itemsData);

                $invoice->refresh();

                $invoice->calculateTotals();
            });

            return back()->with('success', count($validated['items']) . ' articles importés.');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de l\'importation.');
        }
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
                $itemsToDuplicate = $invoice->items()
                    ->whereIn('id', $validated['ids'])
                    ->orderBy('position', 'asc')
                    ->get();

                if ($itemsToDuplicate->isEmpty()) {
                    return;
                }

                $lastSelectedPosition = $itemsToDuplicate->max('position');

                $count = $itemsToDuplicate->count();

                $invoice->items()
                    ->where('position', '>', $lastSelectedPosition)
                    ->increment('position', $count);

                foreach ($itemsToDuplicate as $index => $item) {
                    $newItem = $item->replicate();
                    
                    $newItem->position = $lastSelectedPosition + ($index + 1);
                    
                    $newItem->save();
                }

                $invoice->refresh();

                $invoice->calculateTotals();
            });

            return back()->with('success', 'Lignes dupliquées.');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur duplication.');
        }
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
     * حذف سطر
     */
    public function destroy(Invoice $invoice, InvoiceItem $item)
    {
        try {
            DB::transaction(function () use ($invoice, $item) {
                $item->delete();

                $invoice->refresh();

                $invoice->calculateTotals();
            });

            return back()->with('success', 'Supprimé. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur suppression.');
        }
    }

    /**
     * حذف عدة سطور
     */
    public function destroyMany(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:invoice_items,id'
        ]);

        try {
            DB::transaction(function () use ($invoice, $validated) {
                $invoice->items()->whereIn('id', $validated['ids'])->delete();

                $invoice->refresh();

                $invoice->calculateTotals();
            });

            return back()->with('success', count($validated['ids']) . ' supprimés. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur suppression.');
        }
    }
}