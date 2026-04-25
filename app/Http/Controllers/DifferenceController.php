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
        $reports = Difference::leftJoin('invoice_items', 'differences.invoice_item_id', '=', 'invoice_items.id')
            ->leftJoin('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->leftJoin('boats', 'invoice_items.boat_id', '=', 'boats.id')
            ->select(
                'differences.customer_id',
                // استخراج التاريخ بشكل صريح لضمان ظهوره في الفرونت إند
                DB::raw('COALESCE(invoices.date, DATE(differences.created_at)) as invoice_date'),
                DB::raw('SUM(differences.total_diff) as total_diff_amount'),
                DB::raw('COUNT(differences.id) as items_count'),
                DB::raw('GROUP_CONCAT(DISTINCT boats.name) as boat_name')
            )
            ->with(['customer'])
            ->groupBy('differences.customer_id', 'invoice_date') // التجميع بالـ Alias الموحد
            ->orderBy('invoice_date', 'desc')
            ->get();

        return Inertia::render('differences', [
            'reports' => $reports
        ]);
    }

    public function showReport(Request $request)
    {
        $customerId = $request->query('customer_id');
        $date = $request->query('date');

        $rawDetails = Difference::where('customer_id', $customerId)
            ->where(function ($query) use ($date) {
                $query->whereHas('invoiceItem.invoice', function ($q) use ($date) {
                    $q->whereDate('date', $date);
                })
                    ->orWhere(function ($q) use ($date) {
                        $q->whereNull('invoice_item_id')
                            ->whereDate('created_at', $date);
                    });
            })
            ->with(['item', 'invoiceItem.invoice', 'invoiceItem.boat', 'customer'])
            ->get();

        if ($rawDetails->isEmpty()) {
            return redirect()->route('differences')->with('error', 'Aucun détail trouvé.');
        }

        // حساب إجمالي الصناديق (بما في ذلك حقل boxes الجديد)
        $totalBoxesOverall = $rawDetails->sum('boxes');

        $totalDiffAmount = $rawDetails->sum('total_diff');

        $groupedDetails = $rawDetails->groupBy(function ($diff) {
            $priceKey = $diff->invoiceItem ? $diff->invoiceItem->unit_price : 'hortax';
            return $diff->item_id . '-' . $diff->real_price . '-' . $priceKey;
        })->map(function ($group) {
            $first = $group->first();

            return [
                'id' => $first->id,
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
            if (str_contains($name, 'poulpe')) {
                return 1;
            }
            if (str_contains($name, 'calam')) {
                return 2;
            }
            if (str_contains($name, 'seiche')) {
                return 3;
            }
            return 4;
        })->values();

        return Inertia::render('differences-show', [
            'details' => $sortedDetails,
            'total_boxes' => $totalBoxesOverall,
            'total_amount' => $totalDiffAmount
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
