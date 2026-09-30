<?php

namespace App\Http\Controllers;

use App\Models\Boat;
use App\Models\Company;
use App\Models\InvoiceItem;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReceiptItemController extends Controller
{
    /**
     * Save a commission (double entry).
     *
     * A commission belongs to the owner of the boat and not to an invoice item,
     * so the boat is the anchor: `boat_id` is stored on both lines to be able to
     * find them back later.
     *
     * Two lines are written:
     *  - the beneficiary line (+) on the receipt of the beneficiary,
     *  - the owner line (-) on the receipt of the boat owner, but only when the
     *    owner is a customer: a company cannot hold a receipt, so in that case
     *    only the beneficiary line is written and the user is told about it.
     */
    public function storeCommission(Request $request)
    {
        $validated = $request->validate([
            'boat_id' => 'required|exists:boats,id',
            'beneficiary_id' => 'required|exists:customers,id',
            'commission_per_unit' => 'required|numeric',
            'unit_count' => 'required|numeric',
            'session_zone_id' => 'required|exists:session_zones,id',
            'date' => 'required|date',
        ]);

        $result = DB::transaction(function () use ($validated) {
            $boat = Boat::with('owner')->findOrFail($validated['boat_id']);
            $boatOwner = $boat->owner;

            if (! $boatOwner) {
                return null;
            }

            // 1. Beneficiary line (+)
            $beneficiaryReceipt = Receipt::firstOrCreate([
                'customer_id' => $validated['beneficiary_id'],
                'session_zone_id' => $validated['session_zone_id'],
                'date' => $validated['date'],
            ]);

            $beneficiaryItem = $beneficiaryReceipt->items()->create([
                'invoice_item_id' => null, // a commission is not linked to an invoice item
                'item_id' => null, // no item either
                'boat_id' => $boat->id,
                'unit_count' => $validated['unit_count'],
                'real_price' => $validated['commission_per_unit'],
                'type' => 'commission',
            ]);

            $beneficiaryReceipt->calculateTotals();

            $isCompanyOwner = $boatOwner instanceof Company;

            if ($isCompanyOwner) {
                return ['owner_name' => $boatOwner->name, 'owner_is_company' => true];
            }

            // 2. Owner line (-)
            $ownerReceipt = Receipt::firstOrCreate([
                'customer_id' => $boatOwner->id,
                'session_zone_id' => $validated['session_zone_id'],
                'date' => $validated['date'],
                'boat_id' => $boat->id,
            ]);

            $ownerItem = $ownerReceipt->items()->create([
                'invoice_item_id' => null,
                'item_id' => null,
                'boat_id' => $boat->id,
                'unit_count' => $validated['unit_count'],
                'real_price' => -abs($validated['commission_per_unit']),
                'type' => 'commission',
            ]);

            // Keep the link between the two lines: without it, finding the twin
            // again to update or delete the commission is not reliable.
            $beneficiaryItem->update(['commission_twin_id' => $ownerItem->id]);
            $ownerItem->update(['commission_twin_id' => $beneficiaryItem->id]);

            $ownerReceipt->calculateTotals();

            return ['owner_name' => $boatOwner->name, 'owner_is_company' => false];
        });

        if (! $result) {
            return back()->with('error', "Ce bateau n'a pas de propriétaire assigné.");
        }

        if ($result['owner_is_company']) {
            return back()->with('error', 'Commission enregistrée pour le bénéficiaire uniquement : le propriétaire du bateau est une société, qui ne peut pas porter de bon de réception.');
        }

        return back()->with('success', 'Commission enregistrée.');
    }

    /**
     * تحديث الكوميسيون (Double Entry)
     */
    // public function updateCommission(Request $request, Receipt $receipt, ReceiptItem $item)
    // {
    //     $validated = $request->validate([
    //         'invoice_item_id' => 'required|exists:invoice_items,id',
    //         'beneficiary_id'  => 'required|exists:customers,id',
    //         'commission_per_unit' => 'required|numeric',
    //         'unit_count'      => 'required|numeric',
    //         'session_zone_id' => 'required|exists:session_zones,id',
    //         'date'            => 'required|date',
    //     ]);

    //     $updatedItem = DB::transaction(function () use ($validated, $item) {
    //         // 1. مسح السطور القديمة المرتبطة بهاد الكوميسيون
    //         // كنمسحو أي سطر عنده نفس invoice_item_id و نوعه commission
    //         $relatedItems = ReceiptItem::where('invoice_item_id', $item->invoice_item_id)
    //             ->where('type', 'commission')
    //             ->get();

    //         foreach ($relatedItems as $ri) {
    //             $r = $ri->receipt;
    //             $ri->delete();
    //             if ($r) $r->calculateTotals();
    //         }

    //         // 2. عاود عيط لـ نفس المنطق ديال الـ Store باش تكريهوم من جديد نقيين
    //         // عيط لـ الدالة storeCommission اللي ديجا عندك أو دير refactor للمنطق
    //         return $this->processCommissionLogic($validated);
    //     });

    //     return back()->with([
    //         'success' => 'Commission mise à jour.',
    //         'updated_item' => $updatedItem
    //     ]);
    // }

    /**
     * Update a commission (double entry).
     *
     * The beneficiary can change, so the line is moved to the receipt of the new
     * beneficiary instead of renaming the receipt: renaming it would drag the
     * other lines of that receipt (the regular items of the day) over to the new
     * beneficiary. The owner line is found through `commission_twin_id`.
     *
     * Note: the line itself is the source of truth, the route receipt is only
     * used as a fallback.
     */
    public function updateCommission(Request $request, Receipt $receipt, ReceiptItem $item)
    {
        $validated = $request->validate([
            'boat_id' => 'required|exists:boats,id',
            'beneficiary_id' => 'required|exists:customers,id',
            'commission_per_unit' => 'required|numeric',
            'unit_count' => 'required|numeric',
            'session_zone_id' => 'required|exists:session_zones,id',
            'date' => 'required|date',
        ]);

        if ($item->type !== 'commission') {
            return back()->with('error', "Ce bon n'est pas une commission.");
        }

        $boat = Boat::with('owner')->findOrFail($validated['boat_id']);
        $boatOwner = $boat->owner;

        if (! $boatOwner) {
            return back()->with('error', "Ce bateau n'a pas de propriétaire assigné.");
        }

        DB::transaction(function () use ($validated, $item, $receipt, $boat) {
            $unitCount = $validated['unit_count'];
            $unitPrice = $validated['commission_per_unit'];

            // 1. A commission line always sits on the receipt of its beneficiary.
            $targetReceipt = Receipt::firstOrCreate([
                'customer_id' => $validated['beneficiary_id'],
                'session_zone_id' => $validated['session_zone_id'],
                'date' => $validated['date'],
            ]);

            $sourceReceipt = $item->receipt ?? $receipt;

            if ($sourceReceipt && $sourceReceipt->id !== $targetReceipt->id) {
                $item->update(['receipt_id' => $targetReceipt->id]);

                $sourceReceipt->refresh()->calculateTotals();

                // A receipt left without any line is not kept around.
                if ($sourceReceipt->items()->count() === 0) {
                    $sourceReceipt->delete();
                }
            }

            $targetReceipt->refresh()->calculateTotals();

            // 2. Values of the beneficiary line.
            $item->update([
                'boat_id' => $boat->id,
                'unit_count' => $unitCount,
                'real_price' => $unitPrice,
            ]);

            // 3. Owner line, found through the twin link saved at creation.
            $twinItem = $item->commission_twin_id
                ? ReceiptItem::find($item->commission_twin_id)
                : null;

            if (! $twinItem) {
                return;
            }

            $twinItem->update([
                'boat_id' => $boat->id,
                'unit_count' => $unitCount,
                'real_price' => -abs($unitPrice),
            ]);

            $ownerReceipt = $twinItem->receipt;

            if ($ownerReceipt) {
                $ownerReceipt->update([
                    'session_zone_id' => $validated['session_zone_id'],
                    'date' => $validated['date'],
                ]);

                $ownerReceipt->calculateTotals();
            }
        });

        return back()->with('success', 'Commission mise à jour avec succès.');
    }

    // نصيحة: جمع Logic ديال الـ Commission ف دالة وحدة باش تستعملها ف الـ store والـ update
    private function processCommissionLogic($validated)
    {
        $invoiceItem = InvoiceItem::with('boat.owner')->findOrFail($validated['invoice_item_id']);
        $boatOwner = $invoiceItem->boat->owner;

        if (! $boatOwner) {
            return null;
        }

        // المستفيد (+)
        $beneficiaryReceipt = Receipt::firstOrCreate([
            'customer_id' => $validated['beneficiary_id'],
            'session_zone_id' => $validated['session_zone_id'],
            'date' => $validated['date'],
        ]);

        $beneficiaryReceipt->items()->create([
            'invoice_item_id' => $validated['invoice_item_id'],
            'unit_count' => $validated['unit_count'],
            'real_price' => $validated['commission_per_unit'],
            'type' => 'commission',
        ]);
        $beneficiaryReceipt->calculateTotals();
        $beneficiaryReceipt->refresh();

        // مول الباطو (-)
        $ownerReceipt = Receipt::firstOrCreate([
            'customer_id' => $boatOwner->id,
            'session_zone_id' => $validated['session_zone_id'],
            'date' => $validated['date'],
            'boat_id' => $invoiceItem->boat_id,
        ]);

        $ownerReceipt->items()->create([
            'invoice_item_id' => $validated['invoice_item_id'],
            'unit_count' => $validated['unit_count'],
            'real_price' => -abs($validated['commission_per_unit']),
            'type' => 'commission',
        ]);
        $ownerReceipt->calculateTotals();
        $ownerReceipt->refresh();

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
            'item_id' => 'nullable|exists:items,id',
            'invoice_item_id' => 'nullable|exists:invoice_items,id',
            'unit_count' => 'required|numeric',
            'real_price' => 'required|numeric',
            'type' => 'nullable|string|in:item,commission,freetax',
            'box' => 'nullable|integer',
            'target_id' => 'nullable|exists:receipt_items,id',
            'direction' => 'nullable|in:above,below',
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
                'item_id' => $validated['item_id'] ?? null,
                'invoice_item_id' => $validated['invoice_item_id'] ?? null,
                'unit_count' => $validated['unit_count'],
                'real_price' => $validated['real_price'],
                'box' => $validated['box'] ?? 0,
                'type' => $validated['type'] ?? 'item',
                'total_diff' => $validated['unit_count'] * $validated['real_price'],
                'position' => $position,
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
            'item_id' => 'nullable|exists:items,id',
            'invoice_item_id' => 'nullable|exists:invoice_items,id', // 🟢 زدناها هنا
            'unit_count' => 'nullable|numeric',
            'real_price' => 'nullable|numeric',
            'type' => 'nullable|string|in:item,commission,freetax', // 🟢 زدناها هنا
            'box' => 'nullable|integer',
            'position' => 'nullable|integer',
        ]);

        DB::transaction(function () use ($item, $validated) {
            $unitCount = $validated['unit_count'] ?? $item->unit_count;
            $realPrice = $validated['real_price'] ?? $item->real_price;

            $item->update([
                'item_id' => $validated['item_id'] ?? $item->item_id,
                'invoice_item_id' => $validated['invoice_item_id'] ?? $item->invoice_item_id,
                'type' => $validated['type'] ?? $item->type,
                'unit_count' => $unitCount,
                'real_price' => $realPrice,
                'box' => $validated['box'] ?? $item->box,
                'total_diff' => $unitCount * $realPrice,
                'position' => $validated['position'] ?? $item->position,
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
            'items' => 'required|array',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.invoice_item_id' => 'nullable|exists:invoice_items,id', // 🟢 زدناها هنا
            'items.*.type' => 'nullable|string', // 🟢 زدناها هنا
            'items.*.unit_count' => 'required|numeric',
            'items.*.real_price' => 'required|numeric',
            'items.*.box' => 'required|integer',
        ]);

        DB::transaction(function () use ($receipt, $validated) {
            $lastPosition = $receipt->items()->max('position') ?? -1;
            foreach ($validated['items'] as $index => $itemData) {
                $receipt->items()->create([
                    'item_id' => $itemData['item_id'],
                    'invoice_item_id' => $itemData['invoice_item_id'] ?? null,
                    'unit_count' => $itemData['unit_count'],
                    'real_price' => $itemData['real_price'],
                    'box' => $itemData['box'] ?? 0,
                    'type' => $itemData['type'] ?? 'item',
                    'total_diff' => $itemData['unit_count'] * $itemData['real_price'],
                    'position' => $lastPosition + ($index + 1),
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
            'ids' => 'required|array',
            'ids.*' => 'exists:receipt_items,id',
        ]);

        try {
            DB::transaction(function () use ($receipt, $validated) {
                $itemsToDuplicate = $receipt->items()
                    ->whereIn('id', $validated['ids'])
                    ->orderBy('position', 'asc')
                    ->get();

                if ($itemsToDuplicate->isEmpty()) {
                    return;
                }

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
            'items' => 'required|array',
            'items.*' => 'exists:receipt_items,id',
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
     * Delete a line and clean up the receipts it leaves empty.
     *
     * A commission is two lines (beneficiary + owner): deleting the beneficiary
     * line must delete its twin too, otherwise the boat owner keeps a negative
     * commission that nobody can edit any more. The twin link is nulled on
     * delete, which is why the twin is read before the line is removed.
     */
    public function destroy(Receipt $receipt, ReceiptItem $item)
    {
        $isCommission = $item->type === 'commission';
        $twinId = $item->commission_twin_id;

        DB::transaction(function () use ($item, $isCommission, $twinId) {
            if (! $isCommission || ! $twinId) {
                $item->delete();

                return;
            }

            // 1. Read the twin before the delete nulls the link.
            $twinItem = ReceiptItem::find($twinId);
            $twinReceipt = $twinItem?->receipt;

            // 2. Delete the requested line.
            $item->delete();

            // 3. Delete the twin (boat owner line) and clean its receipt.
            if ($twinItem) {
                $twinItem->delete();

                if ($twinReceipt) {
                    $twinReceipt->calculateTotals();

                    if ($twinReceipt->items()->count() === 0) {
                        $twinReceipt->delete();
                    }
                }
            }
        });

        // 4. Recalculate the receipt of the deleted line and drop it if empty.
        $receipt->calculateTotals();
        $receipt->refresh();

        $receiptDeleted = false;

        if ($receipt->items()->count() === 0) {
            $receipt->delete();

            $receiptDeleted = true;
        }

        if (! $receiptDeleted) {
            $receipt->refresh();
        }

        return back()->with([
            'success' => $receiptDeleted ? 'Receipt supprimé car il est vide' : 'Supprimé ✅',
            'refresh_all' => true,
        ]);
    }

    /**
     * حذف مجموعة سطور
     */
    public function destroyMany(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:receipt_items,id',
        ]);

        try {
            DB::transaction(function () use ($receipt, $validated) {
                $receipt->items()->whereIn('id', $validated['ids'])->delete();
            });

            $receipt->calculateTotals();

            return back()->with('success', count($validated['ids']).' supprimés. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }
}
