<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\InvoiceItem;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReceiptItemController extends Controller
{

    /**
     * دالة الكوميسيون (Double Entry)
     * كتكريي سطر للمستفيد (+) وسطر لمول الباطو (-)
     */
    public function storeCommission(Request $request)
    {
        $validated = $request->validate([
            'invoice_item_id' => 'required|exists:invoice_items,id',
            'beneficiary_id'  => 'required|exists:customers,id',
            'commission_per_unit' => 'required|numeric',
            'unit_count'      => 'required|numeric',
            'session_id'      => 'required|exists:daily_sessions,id',
            'date'            => 'required|date',
        ]);

        $updatedItem = DB::transaction(function () use ($validated) {
            $invoiceItem = InvoiceItem::with('boat.owner')->findOrFail($validated['invoice_item_id']);
            $boatOwner = $invoiceItem->boat->owner;

            if (!$boatOwner) {
                return null;
            }

            // 1. المستفيد (+)
            $beneficiaryReceipt = Receipt::firstOrCreate([
                'customer_id' => $validated['beneficiary_id'],
                'session_id'  => $validated['session_id'],
                'date'        => $validated['date'],
            ]);

            $beneficiaryReceipt->items()->create([
                'invoice_item_id' => $validated['invoice_item_id'],
                'item_id'    => null, // خليناها خاوية هنا
                'unit_count' => $validated['unit_count'],
                'real_price' => $validated['commission_per_unit'],
                'type'       => 'commission',
            ]);

            $beneficiaryReceipt->calculateTotals();

            // 2. مول الباطو (-)
            $ownerReceipt = Receipt::firstOrCreate([
                'customer_id' => $boatOwner->id,
                'session_id'  => $validated['session_id'],
                'date'        => $validated['date'],
                'boat_id'     => $invoiceItem->boat_id,
            ]);

            $ownerReceipt->items()->create([
                'invoice_item_id' => $validated['invoice_item_id'],
                'item_id'    => null, // خليناها خاوية هنا
                'unit_count' => $validated['unit_count'],
                'real_price' => -abs($validated['commission_per_unit']),
                'type'       => 'commission',
            ]);

            $ownerReceipt->calculateTotals();

            // كنرجعو الـ Item مع الـ commissions (الموجبة فقط) باش الـ Frontend يتحدث
            return InvoiceItem::with(['receiptItems' => function ($q) {
                $q->where('type', 'commission')
                    ->where('real_price', '>', 0) // باش يطلع غير المستفيد فـ الـ Dialog
                    ->with('receipt.customer');
            }])->find($validated['invoice_item_id']);
        });

        if (!$updatedItem) {
            return back()->with('error', "Ce bateau n'a pas de propriétaire assigné.");
        }

        return back()->with([
            'success' => 'Commission enregistrée.',
            'updated_item' => $updatedItem
        ]);
    }

    /**
     * تحديث الكوميسيون (Double Entry)
     */
    public function updateCommission(Request $request, Receipt $receipt, ReceiptItem $item)
    {
        $validated = $request->validate([
            'invoice_item_id' => 'required|exists:invoice_items,id',
            'beneficiary_id'  => 'required|exists:customers,id',
            'commission_per_unit' => 'required|numeric',
            'unit_count'      => 'required|numeric',
            'session_id'      => 'required|exists:daily_sessions,id',
            'date'            => 'required|date',
        ]);

        $updatedItem = DB::transaction(function () use ($validated, $item) {
            // 1. مسح السطور القديمة المرتبطة بهاد الكوميسيون
            // كنمسحو أي سطر عنده نفس invoice_item_id و نوعه commission
            $relatedItems = ReceiptItem::where('invoice_item_id', $item->invoice_item_id)
                ->where('type', 'commission')
                ->get();

            foreach ($relatedItems as $ri) {
                $r = $ri->receipt;
                $ri->delete();
                if ($r) $r->calculateTotals();
            }

            // 2. عاود عيط لـ نفس المنطق ديال الـ Store باش تكريهوم من جديد نقيين
            // عيط لـ الدالة storeCommission اللي ديجا عندك أو دير refactor للمنطق
            return $this->processCommissionLogic($validated);
        });

        return back()->with([
            'success' => 'Commission mise à jour.',
            'updated_item' => $updatedItem
        ]);
    }

    // نصيحة: جمع Logic ديال الـ Commission ف دالة وحدة باش تستعملها ف الـ store والـ update
    private function processCommissionLogic($validated)
    {
        $invoiceItem = InvoiceItem::with('boat.owner')->findOrFail($validated['invoice_item_id']);
        $boatOwner = $invoiceItem->boat->owner;

        if (!$boatOwner) return null;

        // المستفيد (+)
        $beneficiaryReceipt = Receipt::firstOrCreate([
            'customer_id' => $validated['beneficiary_id'],
            'session_id'  => $validated['session_id'],
            'date'        => $validated['date'],
        ]);

        $beneficiaryReceipt->items()->create([
            'invoice_item_id' => $validated['invoice_item_id'],
            'unit_count' => $validated['unit_count'],
            'real_price' => $validated['commission_per_unit'],
            'type'       => 'commission',
        ]);
        $beneficiaryReceipt->calculateTotals();

        // مول الباطو (-)
        $ownerReceipt = Receipt::firstOrCreate([
            'customer_id' => $boatOwner->id,
            'session_id'  => $validated['session_id'],
            'date'        => $validated['date'],
            'boat_id'     => $invoiceItem->boat_id,
        ]);

        $ownerReceipt->items()->create([
            'invoice_item_id' => $validated['invoice_item_id'],
            'unit_count' => $validated['unit_count'],
            'real_price' => -abs($validated['commission_per_unit']),
            'type'       => 'commission',
        ]);
        $ownerReceipt->calculateTotals();

        return InvoiceItem::with(['receiptItems' => function ($q) {
            $q->where('type', 'commission')->where('real_price', '>', 0)->with('receipt.customer');
        }])->find($validated['invoice_item_id']);
    }

    /**
     * إضافة سطر عادي (مع دعم النوع والربط)
     */
    public function store(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'item_id'         => 'nullable|exists:items,id',
            'invoice_item_id' => 'nullable|exists:invoice_items,id',
            'unit_count'      => 'required|numeric',
            'real_price'      => 'required|numeric',
            'type'            => 'nullable|string|in:item,commission,freetax',
            'box'             => 'nullable|integer',
            'target_id'       => 'nullable|exists:receipt_items,id',
            'direction'       => 'nullable|in:above,below',
        ]);

        DB::transaction(function () use ($request, $receipt, $validated) {
            $position = 0;
            if ($request->filled('target_id') && $request->filled('direction')) {
                $targetItem = ReceiptItem::findOrFail($validated['target_id']);
                $position = ($validated['direction'] === 'above') ? $targetItem->position : $targetItem->position + 1;
                $receipt->items()->where('position', '>=', $position)->increment('position');
            } else {
                $position = $receipt->items()->max('position') + 1;
            }

            $receipt->items()->create([
                'item_id'         => $validated['item_id'] ?? null,
                'invoice_item_id' => $validated['invoice_item_id'] ?? null,
                'unit_count'      => $validated['unit_count'],
                'real_price'      => $validated['real_price'],
                'box'             => $validated['box'] ?? 0,
                'type'            => $validated['type'] ?? 'item',
                'total_diff'      => $validated['unit_count'] * $validated['real_price'],
                'position'        => $position,
            ]);
            $receipt->calculateTotals();
        });

        return back()->with('success', 'Ligne ajoutée.');
    }

    /**
     * تحديث سطر (دابا غايقدر يغير حتى النوع أو الربط)
     */
    public function update(Request $request, Receipt $receipt, ReceiptItem $item)
    {
        $validated = $request->validate([
            'item_id'         => 'nullable|exists:items,id',
            'invoice_item_id' => 'nullable|exists:invoice_items,id', // 🟢 زدناها هنا
            'unit_count'      => 'nullable|numeric',
            'real_price'      => 'nullable|numeric',
            'type'            => 'nullable|string|in:item,commission,freetax', // 🟢 زدناها هنا
            'box'             => 'nullable|integer',
            'position'        => 'nullable|integer',
        ]);

        DB::transaction(function () use ($item, $validated) {
            $unitCount = $validated['unit_count'] ?? $item->unit_count;
            $realPrice = $validated['real_price'] ?? $item->real_price;

            $item->update([
                'item_id'         => $validated['item_id'] ?? $item->item_id,
                'invoice_item_id' => $validated['invoice_item_id'] ?? $item->invoice_item_id,
                'type'            => $validated['type'] ?? $item->type,
                'unit_count'      => $unitCount,
                'real_price'      => $realPrice,
                'box'             => $validated['box'] ?? $item->box,
                'total_diff'      => $unitCount * $realPrice,
                'position'        => $validated['position'] ?? $item->position,
            ]);
            $item->receipt->calculateTotals();
        });

        return back()->with('success', 'Ligne mise à jour.');
    }

    /**
     * Import Bulk (حتى هو بدعم النوع)
     */
    public function bulkStore(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'items'                     => 'required|array',
            'items.*.item_id'           => 'required|exists:items,id',
            'items.*.invoice_item_id'   => 'nullable|exists:invoice_items,id', // 🟢 زدناها هنا
            'items.*.type'              => 'nullable|string', // 🟢 زدناها هنا
            'items.*.unit_count'        => 'required|numeric',
            'items.*.real_price'        => 'required|numeric',
            'items.*.box'               => 'required|integer',
        ]);

        DB::transaction(function () use ($receipt, $validated) {
            $lastPosition = $receipt->items()->max('position') ?? -1;
            foreach ($validated['items'] as $index => $itemData) {
                $receipt->items()->create([
                    'item_id'         => $itemData['item_id'],
                    'invoice_item_id' => $itemData['invoice_item_id'] ?? null,
                    'unit_count'      => $itemData['unit_count'],
                    'real_price'      => $itemData['real_price'],
                    'box'             => $itemData['box'] ?? 0,
                    'type'            => $itemData['type'] ?? 'item',
                    'total_diff'      => $itemData['unit_count'] * $itemData['real_price'],
                    'position'        => $lastPosition + ($index + 1),
                ]);
            }
            $receipt->calculateTotals();
        });

        return back()->with('success', 'Articles importés.');
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
     * حذف سطر مع تنظيف الـ Receipt إلا بقا خاوي (0.00 DH)
     */
    public function destroy(Receipt $receipt, ReceiptItem $item)
    {
        $invoiceItemId = $item->invoice_item_id;
        $isCommission = $item->type === 'commission';
        $realPrice = $item->real_price;

        DB::transaction(function () use ($item, $isCommission, $invoiceItemId, $realPrice, $receipt) { {
                if ($isCommission && $invoiceItemId) { {
                        /**
                         * 1. حذف السطر المستهدف
                         */
                        $item->delete();

                        /**
                         * 2. حذف السطر التوأم (مول الباطو)
                         */
                        $twinItem = ReceiptItem::where('invoice_item_id', $invoiceItemId)
                            ->where('type', 'commission')
                            ->where('real_price', -$realPrice)
                            ->first();

                        if ($twinItem) { {
                                $r = $twinItem->receipt;

                                $twinItem->delete();

                                if ($r) { {
                                        $r->calculateTotals();

                                        // تنظيف الـ Receipt التوأم إلا بقا خاوي
                                        if ($r->items()->count() === 0) { {
                                                $r->delete();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else { {
                        $item->delete();
                    }
                }
            }
        });

        /**
         * 3. تحديث الـ Receipt الحالي وتنظيفه إلا خوى
         */
        $receipt->calculateTotals();

        $receiptDeleted = false;

        if ($receipt->items()->count() === 0) { {
                $receipt->delete();

                $receiptDeleted = true;
            }
        }

        /**
         * تحديث الـ Item للـ Dialog
         */
        $updatedItem = InvoiceItem::with(['receiptItems' => function ($q) { {
                $q->where('type', 'commission')
                    ->where('real_price', '>', 0)
                    ->with('receipt.customer');
            }
        }])->find($invoiceItemId);

        return back()->with([
            'success' => $receiptDeleted ? 'Receipt supprimé car il est vide' : 'Supprimé ✅',
            'updated_item' => $updatedItem
        ]);
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
