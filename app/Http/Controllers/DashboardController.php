<?php

namespace App\Http\Controllers;

use App\Concerns\CalculatesSessionTotals;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\Sale;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Dashboard.
 *
 * Everything shown here is derived from real operations: purchases are the
 * purchase invoices (invoices.type = purchase) and sales are the direct sales
 * (sales table). The trend chart re-uses CalculatesSessionTotals so the
 * buy / sell / margin figures match exactly the ones displayed on the sessions
 * list and the session sheet (the daily_sessions.total_* columns are only
 * frozen at closing time and must never be trusted while a session is open).
 */
class DashboardController extends Controller
{
    use CalculatesSessionTotals;

    /**
     * Number of days covered by the trend chart.
     */
    private const TREND_DAYS = 14;

    /**
     * Number of rows shown in the recent purchases / sales tables.
     */
    private const RECENT_LIMIT = 6;

    /**
     * Render the dashboard with real data.
     */
    public function index()
    {
        $recentPurchases = $this->recentPurchases();
        $recentSales = $this->recentSales();

        $trend = $this->dailyTrend();

        $totals = [
            'buy' => (float) $trend->sum('buy'),
            'sell' => (float) $trend->sum('sell'),
            'margin' => (float) $trend->sum('margin'),
        ];

        // Counters scoped to the trend window, so the card labels stay honest
        // ("Achats (14j)" must count only what the window actually covers).
        $since = Carbon::today()->subDays(self::TREND_DAYS - 1)->startOfDay();

        return Inertia::render('dashboard', [
            'stats' => [
                'purchaseCount' => Invoice::where('type', 'purchase')->where('date', '>=', $since)->count(),
                'saleCount' => Sale::where('date', '>=', $since)->count(),
                'sessionCount' => DailySession::where('session_date', '>=', $since)->count(),
                'openSessionCount' => DailySession::where('session_date', '>=', $since)->where('status', 'open')->count(),
                'totalBuy' => $totals['buy'],
                'totalSell' => $totals['sell'],
                'totalMargin' => $totals['margin'],
            ],
            'trend' => $trend->values(),
            'recentPurchases' => $recentPurchases,
            'recentSales' => $recentSales,
        ]);
    }

    /**
     * Latest purchase invoices with their billable owner.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function recentPurchases(): Collection
    {
        return Invoice::where('type', 'purchase')
            ->with('billable')
            ->latest('date')
            ->latest('id')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'invoice_number' => (string) $invoice->invoice_number,
                'date' => Carbon::parse($invoice->date)->toDateString(),
                'owner' => $invoice->billable?->name,
                'amount' => (float) $invoice->amount,
                'boxes' => (int) $invoice->boxes,
                'weight' => (float) $invoice->weight,
            ]);
    }

    /**
     * Latest direct sales with their customer.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function recentSales(): Collection
    {
        return Sale::with('customer')
            ->latest('date')
            ->latest('id')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn (Sale $sale) => [
                'id' => $sale->id,
                'date' => Carbon::parse($sale->date)->toDateString(),
                'customer' => $sale->customer?->name,
                'type' => $sale->type,
                'amount' => (float) $sale->amount,
                'boxes' => (int) $sale->boxes,
                'weight' => (float) $sale->weight,
            ]);
    }

    /**
     * Daily buy / sell / margin series over the last TREND_DAYS days.
     *
     * The series always covers a continuous range ending today, including the
     * days without any session so the chart keeps a stable time axis.
     *
     * @return Collection<int, array{date: string, buy: float, sell: float, margin: float}>
     */
    private function dailyTrend(): Collection
    {
        $start = Carbon::today()->subDays(self::TREND_DAYS - 1)->startOfDay();

        $sessions = DailySession::where('session_date', '>=', $start)
            ->with('sessionZones:id,daily_session_id')
            ->get()
            ->groupBy(fn (DailySession $session) => Carbon::parse($session->session_date)->toDateString());

        return collect(range(0, self::TREND_DAYS - 1))->map(function (int $offset) use ($start, $sessions) {
            $day = $start->copy()->addDays($offset);
            $key = $day->toDateString();

            $sessionZoneIds = ($sessions[$key] ?? collect())
                ->flatMap(fn (DailySession $session) => $session->sessionZones->pluck('id'))
                ->all();

            $totals = $this->sessionTotals($sessionZoneIds);

            return [
                'date' => $key,
                'buy' => $totals['buy'],
                'sell' => $totals['sell'],
                'margin' => $totals['margin'],
            ];
        });
    }
}
