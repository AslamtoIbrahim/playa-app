<?php

namespace App\Http\Controllers;

use App\Models\Difference;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Item;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceItemController extends Controller
{
    /**k
     * إضافة سطر جديد للفاتورة
     */
    public function store(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'boat_id' => 'nullable|exists:boats,id',
            'category_id' => 'nullable|exists:categories,id',
            'unit_count' => 'nullable|numeric',
            'unit_price' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'unit' => 'nullable|string',
            'box' => 'nullable|integer', // Field jdid
            'target_id' => 'nullable|exists:invoice_items,id',
            'direction' => 'nullable|in:above,below',
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
                'boat_id' => $validated['boat_id'] ?? null,
                'category_id' => $validated['category_id'] ?? null,
                'unit' => $validated['unit'] ?? 'caisse',
                'box' => $validated['box'] ?? 0, // Added here
                'unit_count' => $unitCount,
                'unit_price' => $unitPrice,
                'weight' => floatval($validated['weight'] ?? 0),
                'amount' => $rowAmount,
                'position' => $position,
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
            'category_id' => 'nullable|exists:categories,id',
            'boat_id' => 'nullable|exists:boats,id',
            'unit_count' => 'nullable|numeric',
            'unit_price' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'unit' => 'nullable|string',
            'box' => 'nullable|integer', // Field jdid
            'position' => 'nullable|integer',
        ]);

        $unitCount = floatval($validated['unit_count'] ?? $item->unit_count ?? 0);

        $unitPrice = floatval($validated['unit_price'] ?? $item->unit_price ?? 0);

        $rowAmount = $unitCount * $unitPrice;

        DB::transaction(function () use ($item, $invoice, $validated, $rowAmount) {
            $previousCategoryId = (int) $item->category_id;
            $nextCategoryId = isset($validated['category_id'])
                ? (int) $validated['category_id']
                : $previousCategoryId;

            $item->update([
                'category_id' => $validated['category_id'] ?? $item->category_id,
                'boat_id' => $validated['boat_id'] ?? $item->boat_id,
                'unit' => $validated['unit'] ?? $item->unit ?? 'caisse',
                'box' => $validated['box'] ?? $item->box ?? 0, // Added here
                'unit_count' => $validated['unit_count'] ?? $item->unit_count ?? 0,
                'unit_price' => $validated['unit_price'] ?? $item->unit_price ?? 0,
                'weight' => $validated['weight'] ?? $item->weight ?? 0,
                'amount' => $rowAmount,
                'position' => $validated['position'] ?? $item->position,
            ]);

            if ($previousCategoryId !== $nextCategoryId) {
                $this->syncRelatedArticles($item, $nextCategoryId);
            }

            $sessionId = $invoice->sessionZone?->daily_session_id;

            if ($sessionId && $previousCategoryId !== (int) $item->category_id) {
                $this->moveGlobalSalesToCategory(
                    $sessionId,
                    $previousCategoryId,
                    (int) $item->category_id,
                    abs((float) $item->unit_count),
                );
            }

            if ($sessionId && $previousCategoryId === (int) $item->category_id) {
                $this->trimGlobalSalesToCategoryStock($sessionId, $previousCategoryId);
            }

            $invoice->refresh();

            $invoice->calculateTotals();
        });

        return back();
    }

    /** Keep invoice-linked sales and differences on an article from the row category. */
    private function syncRelatedArticles(InvoiceItem $invoiceItem, int $categoryId): void
    {
        if (! $invoiceItem->saleItems()->exists() && ! $invoiceItem->differences()->exists()) {
            return;
        }

        $targetItem = Item::query()
            ->where('category_id', $categoryId)
            ->orderBy('id')
            ->first();

        if (! $targetItem) {
            throw ValidationException::withMessages([
                'category_id' => 'Aucun article disponible dans cette catégorie.',
            ]);
        }

        $invoiceItem->saleItems()->get()->each(function (SaleItem $saleItem) use ($targetItem) {
            $saleItem->update(['item_id' => $targetItem->id]);
        });

        $invoiceItem->differences()->get()->each(function (Difference $difference) use ($targetItem) {
            $difference->update(['item_id' => $targetItem->id]);
        });
    }

    /** Move global sale quantities with the category of an edited invoice row. */
    private function moveGlobalSalesToCategory(int $sessionId, int $fromCategoryId, int $toCategoryId, float $quantity): void
    {
        $sourceLines = SaleItem::query()
            ->whereNull('invoice_item_id')
            ->whereNull('boat_id')
            ->whereHas('sale', fn ($query) => $query->where('session_id', $sessionId))
            ->whereHas('item', fn ($query) => $query->where('category_id', $fromCategoryId))
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        $targetItem = Item::query()
            ->where('category_id', $toCategoryId)
            ->orderBy('id')
            ->first();

        $purchased = (float) InvoiceItem::query()
            ->where('category_id', $toCategoryId)
            ->whereHas('invoice.sessionZone', fn ($query) => $query->where('daily_session_id', $sessionId))
            ->sum('unit_count');
        $sold = (float) SaleItem::query()
            ->whereHas('item', fn ($query) => $query->where('category_id', $toCategoryId))
            ->whereHas('sale', fn ($query) => $query->where('session_id', $sessionId))
            ->sum(DB::raw('ABS(unit_count)'));
        $remainingTargetStock = max(0, $purchased - $sold);
        $quantityToMove = min($quantity, $remainingTargetStock);

        if ($targetItem) {
            foreach ($sourceLines as $sourceLine) {
                if ($quantityToMove <= 0) {
                    break;
                }

                $lineQuantity = abs((float) $sourceLine->unit_count);
                $movedQuantity = min($lineQuantity, $quantityToMove);
                $sign = (float) $sourceLine->unit_count < 0 ? -1 : 1;
                $movedLine = $sourceLine->replicate();
                $movedLine->item_id = $targetItem->id;
                $movedLine->unit_count = $sign * $movedQuantity;
                $movedLine->save();

                $remainingLineQuantity = $lineQuantity - $movedQuantity;
                if ($remainingLineQuantity <= 0.00001) {
                    $sourceLine->delete();
                } else {
                    $sourceLine->unit_count = $sign * $remainingLineQuantity;
                    $sourceLine->save();
                }

                $quantityToMove -= $movedQuantity;
            }
        }

        // Any quantity that could not move has no longer-purchased stock behind it.
        $this->trimGlobalSalesToCategoryStock($sessionId, $fromCategoryId);
    }

    /** Reduce global sale rows when an invoice edit makes category sales exceed purchases. */
    private function trimGlobalSalesToCategoryStock(int $sessionId, int $categoryId): void
    {
        $purchased = (float) InvoiceItem::query()
            ->where('category_id', $categoryId)
            ->whereHas('invoice.sessionZone', fn ($query) => $query->where('daily_session_id', $sessionId))
            ->sum('unit_count');
        $sold = (float) SaleItem::query()
            ->whereHas('item', fn ($query) => $query->where('category_id', $categoryId))
            ->whereHas('sale', fn ($query) => $query->where('session_id', $sessionId))
            ->sum(DB::raw('ABS(unit_count)'));
        $excess = max(0, $sold - $purchased);

        if ($excess <= 0.00001) {
            return;
        }

        $globalLines = SaleItem::query()
            ->whereNull('invoice_item_id')
            ->whereNull('boat_id')
            ->whereHas('sale', fn ($query) => $query->where('session_id', $sessionId))
            ->whereHas('item', fn ($query) => $query->where('category_id', $categoryId))
            ->orderByDesc('id')
            ->lockForUpdate()
            ->get();

        foreach ($globalLines as $line) {
            if ($excess <= 0.00001) {
                break;
            }

            $lineQuantity = abs((float) $line->unit_count);
            $reducedQuantity = min($lineQuantity, $excess);
            $remainingQuantity = $lineQuantity - $reducedQuantity;

            if ($remainingQuantity <= 0.00001) {
                $line->delete();
            } else {
                $line->unit_count = (float) $line->unit_count < 0
                    ? -$remainingQuantity
                    : $remainingQuantity;
                $line->save();
            }

            $excess -= $reducedQuantity;
        }
    }

    /**
     * إضافة مجموعة سطور
     */
    public function bulkStore(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.boat_id' => 'nullable|exists:boats,id',
            'items.*.category_id' => 'nullable|exists:categories,id',
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
                        'boat_id' => $item['boat_id'] ?? null,
                        'category_id' => $item['category_id'] ?? null,
                        'unit' => $item['unit'] ?? 'caisse',
                        'box' => $item['box'] ?? 0, // Added here
                        'unit_count' => $item['unit_count'],
                        'unit_price' => $item['unit_price'],
                        'weight' => $item['weight'] ?? 0,
                        'amount' => $item['unit_count'] * $item['unit_price'],
                        'position' => $lastPosition + ($index + 1),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                })->toArray();

                InvoiceItem::insert($itemsData);

                $invoice->refresh();

                $invoice->calculateTotals();
            });

            return back()->with('success', count($validated['items']).' articles importés.');
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
            'ids.*' => 'exists:invoice_items,id',
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
            'items.*' => 'exists:invoice_items,id',
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
     * حذف سطر واحد مع تنظيف شامل للفروقات، العمولات، وصولات الاستلام
     */
    public function destroy(Invoice $invoice, InvoiceItem $item)
    {
        try {
            DB::transaction(function () use ($invoice, $item) {
                $categoryId = $item->category_id ?? Item::whereKey($item->item_id)->value('category_id');

                // 1. كنقلبو على الـ ReceiptItems اللي مرتبطين بهاد السطر قبل ما نمسحوهم
                $receiptItemIds = ReceiptItem::where('invoice_item_id', $item->id)->pluck('receipt_id');

                // 2. مسح الفروقات
                Difference::where('invoice_item_id', $item->id)->delete();

                // 3. مسح سطر العمولة من وصولات الاستلام
                ReceiptItem::where('invoice_item_id', $item->id)->delete();

                // 4. تنظيف الـ Receipts: إذا بقاو خاويين نمسحوهم، وإلا نعاودو نحسبو الـ Total ديالهم
                if ($receiptItemIds->isNotEmpty()) {
                    foreach ($receiptItemIds->unique() as $receiptId) {
                        $receipt = Receipt::find($receiptId);
                        if ($receipt) {
                            if ($receipt->items()->count() == 0) {
                                $receipt->delete(); // مسح الـ Receipt كامل إذا رجع خاوي
                            } else {
                                $receipt->calculateTotals(); // تحديث الحساب إذا بقاو فيه سطور خرين
                            }
                        }
                    }
                }

                // 5. Recorde les ventes touchées avant suppression : la suppression
                // en masse ne déclenche pas les événements du modèle SaleItem, donc
                // les totaux de la vente doivent être recalculés explicitement.
                $affectedSaleIds = SaleItem::where('invoice_item_id', $item->id)->pluck('sale_id');

                // 6. Supprimer les SaleItems liés à cette invoice item
                SaleItem::where('invoice_item_id', $item->id)->delete();

                // 7. Supprimer les Differences liées
                Difference::where('invoice_item_id', $item->id)->delete();

                // 8. Supprimer les ReceiptItems liés
                ReceiptItem::where('invoice_item_id', $item->id)->delete();

                // 9. Supprimer le s-item himself
                $item->delete();

                $invoice->refresh();
                $invoice->calculateTotals();

                // Recalculer les totaux des ventes qui perdaient cette ligne.
                Sale::whereIn('id', $affectedSaleIds)->get()->each(function ($sale) {
                    $sale->calculateTotals();
                });

                $this->reconcileGlobalSaleItems($invoice, array_filter([$categoryId]));

            });

            return back()->with('success', 'Suppression réussie et nettoyage effectué. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }

    /**
     * حذف مجموعة سطور مع تنظيف شامل
     */
    public function destroyMany(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:invoice_items,id',
        ]);

        try {
            DB::transaction(function () use ($invoice, $validated) {
                $ids = $validated['ids'];
                $categoryIds = InvoiceItem::query()
                    ->whereIn('id', $ids)
                    ->get(['category_id', 'item_id'])
                    ->map(fn ($item) => $item->category_id ?? Item::whereKey($item->item_id)->value('category_id'))
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();
                // نجيبو كاع الـ Receipts اللي يقدروا يتأثروا
                $receiptIds = ReceiptItem::whereIn('invoice_item_id', $ids)->pluck('receipt_id')->unique();

                // Recorde les ventes touchées avant suppression : la suppression
                // en masse ne déclenche pas les événements du modèle SaleItem, donc
                // les totaux de la vente doivent être recalculés explicitement.
                $affectedSaleIds = SaleItem::whereIn('invoice_item_id', $ids)->pluck('sale_id')->unique();

                // مسح التوابع
                Difference::whereIn('invoice_item_id', $ids)->delete();
                ReceiptItem::whereIn('invoice_item_id', $ids)->delete();
                SaleItem::whereIn('invoice_item_id', $ids)->delete();

                // تنظيف الـ Receipts
                foreach ($receiptIds as $receiptId) {
                    $receipt = Receipt::find($receiptId);
                    if ($receipt) {
                        if ($receipt->items()->count() == 0) {
                            $receipt->delete();
                        } else {
                            $receipt->calculateTotals();
                        }
                    }
                }

                // حذف الأسطر
                $invoice->items()->whereIn('id', $ids)->delete();

                $invoice->refresh();
                $invoice->calculateTotals();

                // Recalculer les totaux des ventes qui perdaient ces lignes.
                Sale::whereIn('id', $affectedSaleIds)->get()->each(function ($sale) {
                    $sale->calculateTotals();
                });

                $this->reconcileGlobalSaleItems($invoice, $categoryIds);

            });

            return back()->with('success', count($validated['ids']).' supprimés avec nettoyage. ✅');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur suppression groupée.');
        }
    }

    /**
     * Reduce or remove global sale lines when invoice stock in their category
     * is deleted.
     *
     * @param  array<int, int>  $categoryIds
     */
    private function reconcileGlobalSaleItems(Invoice $invoice, array $categoryIds): void
    {
        $sessionId = $invoice->sessionZone()->value('daily_session_id');

        if (! $sessionId) {
            return;
        }

        foreach ($categoryIds as $categoryId) {
            $categoryItemIds = Item::query()
                ->where('category_id', $categoryId)
                ->pluck('id');
            $purchased = InvoiceItem::query()
                ->where(function ($query) use ($categoryId, $categoryItemIds) {
                    $query->where('category_id', $categoryId)
                        ->orWhereIn('item_id', $categoryItemIds);
                })
                ->whereHas('invoice.sessionZone', fn ($query) => $query->where('daily_session_id', $sessionId))
                ->sum('unit_count');
            $directlySold = SaleItem::query()
                ->whereNotNull('invoice_item_id')
                ->whereIn('item_id', $categoryItemIds)
                ->whereIn('sale_id', Sale::query()->where('session_id', $sessionId)->select('id'))
                ->sum(DB::raw('ABS(unit_count)'));
            $remaining = max(0, (float) $purchased - (float) $directlySold);
            $globalSaleItems = SaleItem::query()
                ->whereNull('invoice_item_id')
                ->whereIn('item_id', $categoryItemIds)
                ->whereIn('sale_id', Sale::query()->where('session_id', $sessionId)->select('id'))
                ->orderBy('id')
                ->get();

            foreach ($globalSaleItems as $saleItem) {
                $count = abs((float) $saleItem->unit_count);
                $adjustedCount = min($count, $remaining);

                if ($adjustedCount <= 0) {
                    $saleItem->delete();

                    continue;
                }

                if ($adjustedCount < $count) {
                    $saleItem->unit_count = $saleItem->unit_count < 0
                        ? -$adjustedCount
                        : $adjustedCount;
                    $saleItem->save();
                }

                $remaining -= $adjustedCount;
            }
        }
    }
}
