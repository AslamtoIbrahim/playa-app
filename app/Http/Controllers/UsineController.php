<?php

namespace App\Http\Controllers;

use App\Concerns\CalculatesSessionTotals;
use App\Models\ReceptionRecord;
use App\Models\Sale;
use App\Models\Usine;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UsineController extends Controller
{
    use CalculatesSessionTotals;

    public function index()
    {
        return Inertia::render('usine', [
            'usines' => Usine::latest()->get(),
        ]);
    }

    public function show(Usine $usine)
    {
        $sales = $usine->sales()
            ->with([
                'session.sessionZones.zone',
                'items.item.category',
                'items.invoiceItem.category',
            ])
            ->get();

        $salesBySession = $sales->groupBy('session_id');
        $ownedSaleItemIds = $sales
            ->flatMap(fn (Sale $sale) => $sale->items->pluck('id'))
            ->all();

        $existingRecords = $usine->receptionRecords()
            ->with(['saleItem.item.category', 'saleItem.invoiceItem.category'])
            ->get();

        foreach ($salesBySession as $sessionSales) {
            $session = $sessionSales->first()->session;

            if (! $session) {
                continue;
            }

            $categories = $sessionSales
                ->flatMap(fn (Sale $sale) => $sale->items->map(fn ($item) => [
                    'sale_item_id' => $item->id,
                    'category' => $item->item?->category ?? $item->invoiceItem?->category,
                    'amount' => (float) $item->amount + (float) $item->tax,
                ]))
                ->filter(fn (array $entry) => $entry['category'] !== null)
                ->groupBy(fn (array $entry) => $entry['category']->id)
                ->map(fn ($entries) => [
                    'sale_item_id' => $entries->first()['sale_item_id'],
                    'category' => $entries->first()['category'],
                    'amount' => (float) $entries->sum('amount'),
                ])
                ->values();

            if ($categories->isEmpty()) {
                continue;
            }

            $totals = $this->sessionTotals(
                $session->sessionZones->pluck('id')->all(),
            );

            $sessionTotal = (float) $totals['sell'];
            $categoryBaseTotal = (float) $categories->sum('amount');
            $categoryCount = max($categories->count(), 1);

            // The session total is the reference value: split it across the
            // categories instead of repeating it on every row.
            $categories = $categories
                ->map(function (array $entry) use ($categoryBaseTotal, $sessionTotal, $categoryCount) {
                    $share = abs($categoryBaseTotal) > 0.00001
                        ? $sessionTotal * ($entry['amount'] / $categoryBaseTotal)
                        : $sessionTotal / $categoryCount;

                    return [
                        ...$entry,
                        'amount' => round($share, 2),
                    ];
                })
                ->values();

            $difference = round($sessionTotal - (float) $categories->sum('amount'), 2);

            if (abs($difference) > 0.00001) {
                $lastEntry = $categories->pop();
                $lastEntry['amount'] = round($lastEntry['amount'] + $difference, 2);
                $categories->push($lastEntry);
            }

            $sessionRecords = $existingRecords->where('session_id', $session->id);

            foreach ($categories as $entry) {
                $category = $entry['category'];

                $record = $sessionRecords->first(function (ReceptionRecord $record) use ($category) {
                    $recordCategory = $record->saleItem?->item?->category
                        ?? $record->saleItem?->invoiceItem?->category;

                    return $recordCategory?->id === $category->id;
                });

                if ($record) {
                    // A record created before usine scoping may still point to
                    // another sale's item. Repoint it to this usine's item.
                    if (! in_array($record->sale_item_id, $ownedSaleItemIds, true)) {
                        $record->update(['sale_item_id' => $entry['sale_item_id']]);
                    }

                    continue;
                }

                // Records created by the old backfill have no sale item yet.
                // Attach the first of them to the current category instead of
                // creating a duplicate row.
                $legacyRecord = $sessionRecords->first(
                    fn (ReceptionRecord $record) => $record->sale_item_id === null,
                );

                if ($legacyRecord) {
                    $legacyRecord->update(['sale_item_id' => $entry['sale_item_id']]);
                    $existingRecords = $existingRecords->reject(
                        fn (ReceptionRecord $record) => $record->is($legacyRecord),
                    );
                    $sessionRecords = $sessionRecords->reject(
                        fn (ReceptionRecord $record) => $record->is($legacyRecord),
                    );

                    continue;
                }

                $usine->receptionRecords()->create([
                    'session_id' => $session->id,
                    'sale_item_id' => $entry['sale_item_id'],
                    'amount' => $entry['amount'],
                ]);
            }
        }

        $records = $usine->receptionRecords()
            ->whereIn('sale_item_id', $ownedSaleItemIds)
            ->with([
                'session.sessionZones.zone',
                'saleItem.item.category',
                'saleItem.invoiceItem.category',
            ])
            ->get()
            ->map(function (ReceptionRecord $record) {
                $session = $record->session;
                $category = $record->saleItem?->item?->category
                    ?? $record->saleItem?->invoiceItem?->category;

                return [
                    'id' => $record->id,
                    'session_id' => $record->session_id,
                    'sale_item_id' => $record->sale_item_id,
                    'session_date' => $session?->session_date?->toDateString(),
                    'origin' => $session
                        ? $session->sessionZones->pluck('zone.name')->filter()->unique()->implode(', ')
                        : '',
                    'designation' => $category?->name ?? '—',
                    'weight' => $record->weight,
                    'ttc' => $record->ttc,
                    'amount' => $record->amount,
                    'margin_percentage' => $record->margin_percentage,
                    'is_invoiced' => $record->is_invoiced,
                    'invoice_reference' => $record->invoice_reference,
                ];
            })
            ->filter(fn (array $record) => $record['session_date'] !== null
                && $record['sale_item_id'] !== null
                && $record['designation'] !== '—')
            ->sortBy('designation')
            ->sortByDesc('session_date')
            ->values();

        return Inertia::render('usine-show', [
            'usine' => $usine,
            'receptionRecords' => $records,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ], [
            'name.required' => 'Le nom de l’usine est obligatoire.',
        ]);

        Usine::create($validated);

        return redirect()->back()->with('success', 'Usine créée avec succès !');
    }

    public function update(Request $request, Usine $usine)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ], [
            'name.required' => 'Le nom de l’usine est obligatoire.',
        ]);

        $usine->update($validated);

        return redirect()->back()->with('success', 'Usine mise à jour avec succès !');
    }

    public function destroy(Usine $usine)
    {
        if ($usine->receptionRecords()->exists()) {
            return redirect()->back()->with('error', 'Cette usine possède des réceptions et ne peut pas être supprimée.');
        }

        $usine->delete();

        return redirect()->back()->with('success', 'Usine supprimée avec succès !');
    }
}
