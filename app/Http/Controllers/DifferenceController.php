<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Difference;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DifferenceController extends Controller
{
    public function index()
    {
        // 1. نجبدو الـ Differences هوما الأولين (هادو هوما الأساس)
        $differencesQuery = DB::table('differences')
            ->leftJoin('invoice_items', 'differences.invoice_item_id', '=', 'invoice_items.id')
            ->leftJoin('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->select(
                'differences.customer_id',
                'invoice_items.boat_id',
                DB::raw('COALESCE(invoices.date, DATE(differences.created_at)) as invoice_date'),
                DB::raw('SUM(differences.total_diff) as diff_amount'),
                DB::raw('COUNT(differences.id) as diff_count')
            )
            ->groupBy('differences.customer_id', 'invoice_items.boat_id', 'invoice_date');

        // 2. نجيبو النتائج ديال الـ Differences هي الأولى
        $diffResults = $differencesQuery->get();

        // 3. دابا نتمشاو على كل Difference ونشوفو واش كاين شي Receipt مطابق ليها
        $reports = $diffResults->map(function ($diff) {
            // كنقلبو على الـ Receipts اللي عندهم نفس الكليان، الباطو، والتاريخ
            $receiptAmount = DB::table('receipt_items')
                ->join('receipts', 'receipt_items.receipt_id', '=', 'receipts.id')
                ->where('receipts.customer_id', $diff->customer_id)
                ->where('receipts.boat_id', $diff->boat_id)
                ->whereDate('receipts.date', $diff->invoice_date)
                ->select(
                    DB::raw('SUM(receipt_items.unit_count * receipt_items.real_price) as total_receipt'),
                    DB::raw('COUNT(receipt_items.id) as receipt_count')
                )
                ->first();

            // كنجمعو الحساب: Diff + Receipt (إلا لقى شي حاجة)
            $totalAmount = (float)$diff->diff_amount + (float)($receiptAmount->total_receipt ?? 0);
            $totalItems = $diff->diff_count + ($receiptAmount->receipt_count ?? 0);

            return (object)[
                'customer_id' => $diff->customer_id,
                'boat_id' => $diff->boat_id,
                'invoice_date' => $diff->invoice_date,
                'total_diff_amount' => $totalAmount,
                'items_count' => $totalItems,
                'customer' => \App\Models\Customer::find($diff->customer_id),
                'boat_name' => \App\Models\Boat::find($diff->boat_id)?->name,
            ];
        });

        return Inertia::render('differences', [
            'reports' => $reports->values() // values() باش ترجع Array نقية لـ Inertia
        ]);
    }

    public function showReport(Request $request)
    {
        $customerId = $request->query('customer_id');
        $date = $request->query('date');
        $boatId = $request->query('boat_id');

        // 1. جلب الـ Differences (الفرق فـ الثمن/الوزن)
        $rawDifferences = Difference::where('customer_id', $customerId)
            ->where(function ($query) use ($date, $boatId) {
                $query->whereHas('invoiceItem', function ($q) use ($date, $boatId) {
                    $q->whereHas('invoice', function ($invQ) use ($date) {
                        $invQ->whereDate('date', $date);
                    })->where('boat_id', $boatId);
                });
            })
            ->with(['item', 'invoiceItem.invoice', 'invoiceItem.boat', 'customer'])
            ->get();

        // 2. جلب الـ ReceiptItems (السلع الحرة / FreeTax)
        // هنا كنفترضو أن الموديل ReceiptItem مرتبط بـ Receipt فيه التاريخ والباطو
        $rawReceipts = \App\Models\ReceiptItem::whereHas('receipt', function ($q) use ($customerId, $date, $boatId) {
            $q->where('customer_id', $customerId)
                ->whereDate('date', $date)
                ->where('boat_id', $boatId);
        })
            ->with(['item', 'receipt'])
            ->get();

        // 3. تحويل الـ Receipts لـ Format كيشبه الـ Differences
        $mappedReceipts = $rawReceipts->map(function ($ri) {
            return (object)[
                'id' => 'r' . $ri->id, // حرف r باش نميزو الـ IDs
                'is_extra' => true,    // سلع إضافية ماشي فرق
                'item' => $ri->item,
                'customer' => $ri->receipt->customer ?? null,
                'boxes' => $ri->box,
                'unit_count' => $ri->unit_count,
                'real_price' => $ri->real_price,
                'total_diff' => $ri->unit_count * $ri->real_price,
                'invoiceItem' => (object)[
                    'unit_price' => 0, // السلعة الحرة ما عندهاش prix d'achat فـ الفاتورة
                    'boat' => $ri->receipt->boat ?? null,
                    'invoice' => null
                ]
            ];
        });

        // 4. دمج الـ Differences الأصلية مع الـ Receipts
        // الـ Differences غنعطيوهم is_extra = false
        $allDetails = $rawDifferences->map(function ($d) {
            $d->is_extra = false;
            return $d;
        })->concat($mappedReceipts);

        if ($allDetails->isEmpty()) {
            return redirect()->route('differences')->with('error', 'Aucun détail trouvé.');
        }

        // الحسابات الإجمالية
        $totalBoxesOverall = $allDetails->sum('boxes');
        $totalAmount = $allDetails->sum('total_diff');

        // 5. التجميع (Grouping) باش السلعة اللي كتشابه تجمع
        $groupedDetails = $allDetails->groupBy(function ($detail) {
            $priceKey = isset($detail->invoiceItem) && $detail->invoiceItem->unit_price ? $detail->invoiceItem->unit_price : 'extra';
            return $detail->item->id . '-' . $detail->real_price . '-' . $priceKey . '-' . ($detail->is_extra ? 'e' : 'd');
        })->map(function ($group) {
            $first = $group->first();
            return [
                'id' => $first->id,
                'is_extra' => $first->is_extra,
                'customer' => $first->customer,
                'invoice_item' => [
                    'unit_price' => $first->invoiceItem->unit_price ?? 0,
                    'item' => $first->item,
                    'boat' => $first->invoiceItem->boat ?? null,
                    'invoice' => $first->invoiceItem->invoice ?? null,
                ],
                'boxes' => $group->sum('boxes'),
                'real_price' => $first->real_price,
                'unit_count' => $group->sum('unit_count'),
                'total_diff' => $group->sum('total_diff'),
            ];
        });

        $sortedDetails = $groupedDetails->sortBy(function ($item) {
            $name = strtolower($item['invoice_item']['item']['name'] ?? '');
            if (str_contains($name, 'poulpe')) return 1;
            if (str_contains($name, 'calam')) return 2;
            if (str_contains($name, 'seiche')) return 3;
            return 4;
        })->values();

        return Inertia::render('differences-show', [
            'details' => $sortedDetails,
            'total_boxes' => $totalBoxesOverall,
            'total_amount' => $totalAmount,
            'current_boat' => $allDetails->first()->invoiceItem->boat ?? null
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_item_id' => 'nullable|exists:invoice_items,id', // أصبح اختيارياً للـ Hortax
            'customer_id'    => 'required|exists:customers,id',
            'item_id'        => 'required|exists:items,id',
            'unit_count'     => 'required|numeric|min:0.01',
            'real_price'     => 'required|numeric',
            'boxes'          => 'nullable|integer|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $totalDiff = 0;

            if ($validated['invoice_item_id']) {
                $invoiceItem = InvoiceItem::findOrFail($validated['invoice_item_id']);

                $alreadyDistributed = Difference::where('invoice_item_id', $invoiceItem->id)->sum('unit_count');

                $remaining = $invoiceItem->unit_count - $alreadyDistributed;

                if ($validated['unit_count'] > $remaining) {
                    return back()->with('error', "Quantité insuffisante ! Max: $remaining");
                }

                $totalDiff = ($validated['real_price'] - $invoiceItem->unit_price) * $validated['unit_count'];
            }

            $lastPos = Difference::where('customer_id', $validated['customer_id'])->max('position') ?? -1;

            $newDiff = Difference::create([
                'invoice_item_id' => $validated['invoice_item_id'],
                'customer_id'    => $validated['customer_id'],
                'item_id'        => $validated['item_id'],
                'unit_count'     => $validated['unit_count'],
                'real_price'     => $validated['real_price'],
                'boxes'          => $validated['boxes'] ?? 0,
                'amount'         => $validated['unit_count'] * $validated['real_price'],
                'total_diff'     => $totalDiff,
                'position'       => $lastPos + 1,
            ]);

            return back()->with('success', 'Répartition enregistrée ! ✅');
        });
    }

    public function update(Request $request, Difference $difference)
    {
        $validated = $request->validate([
            'unit_count'  => 'nullable|numeric|min:0.01',
            'real_price'  => 'nullable|numeric',
            'customer_id' => 'nullable|exists:customers,id',
            'item_id'     => 'nullable|exists:items,id',
            'boxes'       => 'nullable|integer|min:0',
            'position'    => 'nullable|integer',
        ]);

        return DB::transaction(function () use ($validated, $difference) {
            $newCount = $validated['unit_count'] ?? $difference->unit_count;

            $newPrice = $validated['real_price'] ?? $difference->real_price;

            $totalDiff = $difference->total_diff;

            if ($difference->invoice_item_id) {
                $invoiceItem = $difference->invoiceItem;

                $otherDist = Difference::where('invoice_item_id', $invoiceItem->id)
                    ->where('id', '!=', $difference->id)
                    ->sum('unit_count');

                if ($newCount > ($invoiceItem->unit_count - $otherDist)) {
                    return back()->with('error', "Quantité invalide !");
                }

                $totalDiff = ($newPrice - $invoiceItem->unit_price) * $newCount;
            }

            $difference->update([
                'customer_id' => $validated['customer_id'] ?? $difference->customer_id,
                'item_id'     => $validated['item_id'] ?? $difference->item_id,
                'unit_count'  => $newCount,
                'real_price'  => $newPrice,
                'boxes'       => $validated['boxes'] ?? $difference->boxes,
                'amount'      => $newCount * $newPrice,
                'total_diff'  => $totalDiff,
                'position'    => $validated['position'] ?? $difference->position,
            ]);

            return back()->with('success', 'Mise à jour réussie ! ✅');
        });
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:differences,id'
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $index => $id) {
                Difference::where('id', $id)->update(['position' => $index]);
            }
        });

        return back()->with('success', 'Ordre mis à jour ! ✅');
    }

    public function destroyMany(Request $request)
    {
        $validated = $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:differences,id']);
        Difference::whereIn('id', $validated['ids'])->delete();
        return back()->with('success', 'Suppressions réussies ! ✅');
    }

    public function duplicateMany(Request $request)
    {
        $validated = $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:differences,id']);

        return DB::transaction(function () use ($validated) {
            $items = Difference::whereIn('id', $validated['ids'])->orderBy('position')->get();

            foreach ($items as $item) {
                // Duplicate Logic (Checking if stock allows can be complex here, 
                // typically we duplicate with 0 or same count and let user adjust)
                $new = $item->replicate();
                $new->position = Difference::where('invoice_item_id', $item->invoice_item_id)->max('position') + 1;
                $new->save();
            }
            return back()->with('success', 'Duplication réussie ! ✅');
        });
    }

    public function destroy(Difference $difference)
    {
        $invoiceItem = $difference->invoiceItem;
        $difference->delete();

        $fullItem = $invoiceItem->load('differences.customer');

        return back()->with([
            'success' => 'Supprimé ! ✅',
            'updated_item' => $fullItem
        ]);
    }
}
