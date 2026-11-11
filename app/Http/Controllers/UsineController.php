<?php

namespace App\Http\Controllers;

use App\Concerns\CalculatesSessionTotals;
use App\Models\Category;
use App\Models\DailySession;
use App\Models\ReceptionRecord;
use App\Models\Sale;
use App\Models\SaleCharge;
use App\Models\Usine;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
                'charges.category',
                'charges.receipt.items.item.category',
                'charges.receipt.items.invoiceItem.category',
            ])
            ->get();

        $salesBySession = $sales->groupBy('session_id');
        $ownedSaleItemIds = $sales
            ->flatMap(fn (Sale $sale) => $sale->items->pluck('id'))
            ->all();
        $sessionIds = $sales
            ->pluck('session_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $existingRecords = $usine->receptionRecords()
            ->with([
                'category',
                'saleItem.item.category',
                'saleItem.invoiceItem.category',
            ])
            ->get();

        $calculatedAmounts = [];

        foreach ($salesBySession as $sessionSales) {
            $session = $sessionSales->first()->session;

            if (! $session) {
                continue;
            }

            $categories = $this->buildSessionCategoryTotals($sessionSales, $session);

            if ($categories->isEmpty()) {
                continue;
            }

            $sessionRecords = $existingRecords->where('session_id', $session->id);

            foreach ($categories as $entry) {
                $category = $entry['category'];
                $calculatedAmounts[$session->id][$category->id] = $entry['amount'];

                $record = $sessionRecords->first(function (ReceptionRecord $record) use ($category) {
                    if ($record->category_id !== null) {
                        return $record->category_id === $category->id;
                    }

                    $recordCategory = $record->saleItem?->item?->category
                        ?? $record->saleItem?->invoiceItem?->category;

                    return $recordCategory?->id === $category->id;
                });

                if ($record) {
                    $updates = [];

                    if ($record->category_id === null) {
                        $updates['category_id'] = $category->id;
                    }

                    // A record created before usine scoping may still point to
                    // another sale's item. Repoint it to this usine's item.
                    if ($entry['sale_item_id'] !== null
                        && ! in_array($record->sale_item_id, $ownedSaleItemIds, true)) {
                        $updates['sale_item_id'] = $entry['sale_item_id'];
                    }

                    if ($updates !== []) {
                        $record->update($updates);
                    }

                    continue;
                }

                // Records created by the old backfill have no sale item yet.
                // Attach the first of them to the current category instead of
                // creating a duplicate row.
                $legacyRecord = $sessionRecords->first(
                    fn (ReceptionRecord $record) => $record->sale_item_id === null
                        && $record->category_id === null,
                );

                if ($legacyRecord) {
                    $legacyRecord->update([
                        'sale_item_id' => $entry['sale_item_id'],
                        'category_id' => $category->id,
                    ]);
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
                    'category_id' => $category->id,
                    'amount' => $entry['amount'],
                ]);
            }
        }

        $records = $usine->receptionRecords()
            ->whereIn('session_id', $sessionIds)
            ->where(function ($query) use ($ownedSaleItemIds) {
                $query->whereIn('sale_item_id', $ownedSaleItemIds)
                    ->orWhereNotNull('category_id');
            })
            ->with([
                'session.sessionZones.zone',
                'category',
                'saleItem.item.category',
                'saleItem.invoiceItem.category',
            ])
            ->get()
            ->map(function (ReceptionRecord $record) use ($calculatedAmounts) {
                $session = $record->session;
                $category = $record->category
                    ?? $record->saleItem?->item?->category
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
                    'amount' => $calculatedAmounts[$record->session_id][$category?->id]
                        ?? $record->amount,
                    'margin_percentage' => $record->margin_percentage,
                    'is_invoiced' => $record->is_invoiced,
                    'invoice_reference' => $record->invoice_reference,
                ];
            })
            ->filter(fn (array $record) => $record['session_date'] !== null
                && $record['designation'] !== '—')
            ->sortBy('designation')
            ->sortByDesc('session_date')
            ->values();

        return Inertia::render('usine-show', [
            'usine' => $usine,
            'receptionRecords' => $records,
        ]);
    }

    /**
     * Category totals of a usine session.
     *
     * Sale item values form the category base; receipt charges are then
     * allocated to categories without scaling them to the session sell total.
     */
    private function buildSessionCategoryTotals(Collection $sessionSales, DailySession $session): Collection
    {
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

        $categoryTotals = $categories
            ->keyBy(fn (array $entry) => $entry['category']->id)
            ->all();

        $relevantCategories = $categories
            ->map(fn (array $entry) => $entry['category'])
            ->values();

        foreach ($sessionSales as $sale) {
            foreach ($sale->charges as $charge) {
                foreach ($this->distributeCharge($charge, $relevantCategories) as $categoryId => $distribution) {
                    if (! isset($categoryTotals[$categoryId])) {
                        $categoryTotals[$categoryId] = [
                            'sale_item_id' => null,
                            'category' => $distribution['category'],
                            'amount' => 0.0,
                        ];
                    }

                    $categoryTotals[$categoryId]['amount'] = round(
                        $categoryTotals[$categoryId]['amount'] + $distribution['amount'],
                        2,
                    );
                }
            }
        }

        return collect($categoryTotals)->values();
    }

    /**
     * Split one charge across the categories it belongs to.
     *
     * @param  Collection<int, Category>  $fallbackCategories
     * @return array<int, array{category: Category, amount: float}>
     */
    private function distributeCharge(SaleCharge $charge, Collection $fallbackCategories): array
    {
        $amount = (float) $charge->amount;

        if (abs($amount) < 0.00001) {
            return [];
        }

        if ($charge->category) {
            return [
                $charge->category->id => [
                    'category' => $charge->category,
                    'amount' => round($amount, 2),
                ],
            ];
        }

        $fallbackWeights = [];
        $fallbackCategoryMap = [];

        foreach ($fallbackCategories as $category) {
            $fallbackWeights[$category->id] = 1.0;
            $fallbackCategoryMap[$category->id] = $category;
        }

        if ($fallbackWeights === []) {
            return [];
        }

        return $this->allocateAmount($amount, $fallbackWeights, $fallbackCategoryMap);
    }

    /**
     * Allocate an amount in cents so the rounded shares keep the exact total.
     *
     * @param  array<int, float>  $weights
     * @param  array<int, Category>  $categories
     * @return array<int, array{category: Category, amount: float}>
     */
    private function allocateAmount(float $amount, array $weights, array $categories): array
    {
        $totalWeight = array_sum($weights);

        if ($totalWeight <= 0.00001) {
            return [];
        }

        $totalCents = (int) round($amount * 100);
        $remainingCents = $totalCents;
        $lastCategoryId = array_key_last($weights);
        $allocation = [];

        foreach ($weights as $categoryId => $weight) {
            if ($categoryId === $lastCategoryId) {
                $cents = $remainingCents;
            } else {
                $cents = (int) round($totalCents * ($weight / $totalWeight));
                $remainingCents -= $cents;
            }

            if ($cents === 0) {
                continue;
            }

            $allocation[$categoryId] = [
                'category' => $categories[$categoryId],
                'amount' => $cents / 100,
            ];
        }

        return $allocation;
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
