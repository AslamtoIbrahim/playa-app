<?php

namespace App\Http\Controllers;

use App\Models\Difference;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DifferenceController extends Controller
{
    // public function index()
    // {
    //     $differences = Difference::with(['invoiceItem', 'customer'])->orderBy('position')->get();
    //     return Inertia::render('differences', ['differences' => $differences]);
    // }

    public function index()
    {
        $reports = Difference::whereHas('invoiceItem.invoice')
            ->join('invoice_items', 'differences.invoice_item_id', '=', 'invoice_items.id')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('boats', 'invoice_items.boat_id', '=', 'boats.id')
            ->select(
                'differences.customer_id',
                DB::raw('invoices.date as invoice_date'),
                DB::raw('SUM(differences.total_diff) as total_diff_amount'),
                DB::raw('COUNT(differences.id) as items_count'),
                DB::raw('GROUP_CONCAT(DISTINCT boats.name) as boat_name')
            )
            ->with(['customer'])
            ->groupBy('differences.customer_id', 'invoices.date')
            ->orderBy('invoices.date', 'desc')
            ->get();

        return Inertia::render('differences', [
            'reports' => $reports
        ]);
    }

    public function showReport(Request $request)
    {
        $customerId = $request->query('customer_id');
        $date = $request->query('date');

        $details = Difference::where('customer_id', $customerId)
            ->whereHas('invoiceItem.invoice', function ($query) use ($date) {
                $query->whereDate('date', $date);
            })
            ->with(['invoiceItem.invoice', 'invoiceItem.item', 'invoiceItem.boat', 'customer'])
            ->get();

        if ($details->isEmpty()) {
            return redirect()->route('differences')->with('error', 'Aucun détail trouvé.');
        }

        return Inertia::render('differences-show', [
            'details' => $details
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_item_id' => 'required|exists:invoice_items,id',
            'customer_id'    => 'required|exists:customers,id',
            'unit_count'     => 'required|numeric|min:0.01',
            'real_price'     => 'required|numeric',
        ]);

        return DB::transaction(function () use ($validated) {
            $invoiceItem = InvoiceItem::findOrFail($validated['invoice_item_id']);

            $alreadyDistributed = Difference::where('invoice_item_id', $invoiceItem->id)->sum('unit_count');
            $remaining = $invoiceItem->unit_count - $alreadyDistributed;

            if ($validated['unit_count'] > $remaining) {
                return back()->with('error', "Quantité insuffisante ! Max: $remaining");
            }

            $lastPos = Difference::where('invoice_item_id', $invoiceItem->id)->max('position') ?? -1;

            $newDiff = Difference::create([
                'invoice_item_id' => $validated['invoice_item_id'],
                'customer_id'    => $validated['customer_id'],
                'unit_count'     => $validated['unit_count'],
                'real_price'     => $validated['real_price'],
                'amount'         => $validated['unit_count'] * $validated['real_price'],
                'total_diff'     => ($validated['real_price'] - $invoiceItem->unit_price) * $validated['unit_count'],
                'position'       => $lastPos + 1,
            ]);

            // كنصيفطو الـ item كامل مع الـ differences باش React يعرف شنو زاد
            $fullItem = $invoiceItem->load('differences.customer');

            return back()->with([
                'success' => 'Répartition enregistrée ! ✅',
                'updated_item' => $fullItem
            ]);
        });
    }

    public function update(Request $request, Difference $difference)
    {
        $validated = $request->validate([
            'unit_count' => 'nullable|numeric|min:0.01',
            'real_price' => 'nullable|numeric',
            'customer_id' => 'nullable|exists:customers,id',
            'position'   => 'nullable|integer',
        ]);

        return DB::transaction(function () use ($validated, $difference) {
            $invoiceItem = $difference->invoiceItem;
            $newCount = $validated['unit_count'] ?? $difference->unit_count;
            $newPrice = $validated['real_price'] ?? $difference->real_price;

            $otherDist = Difference::where('invoice_item_id', $invoiceItem->id)
                ->where('id', '!=', $difference->id)->sum('unit_count');

            if ($newCount > ($invoiceItem->unit_count - $otherDist)) {
                return back()->with('error', "Quantité invalide !");
            }

            $difference->update([
                'customer_id' => $validated['customer_id'] ?? $difference->customer_id,
                'unit_count'  => $newCount,
                'real_price'  => $newPrice,
                'amount'      => $newCount * $newPrice,
                'total_diff'  => ($newPrice - $invoiceItem->unit_price) * $newCount,
                'position'    => $validated['position'] ?? $difference->position,
            ]);

            $fullItem = $invoiceItem->load('differences.customer');

            return back()->with([
                'success' => 'Mise à jour réussie ! ✅',
                'updated_item' => $fullItem
            ]);
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
