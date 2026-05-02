<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\Difference;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DailySessionController extends Controller
{
    /**
     * Afficher la liste des sessions avec calcul dynamique
     */
    public function index()
    {
        $sessions = DailySession::latest('session_date')->get()->map(function ($session) {

            // --- 1. ACHAT (Purchase) ---
            // Ghadi n-akhdo ghir l-invoices lli l-type dyalhom 'purchase'
            $purchaseInvoicesTotal = Invoice::where('session_id', $session->id)
                ->where('type', 'purchase')
                ->sum('amount') ?? 0;

            // Differences dyal l-achat
            $purchaseDifferences = Difference::whereHas('invoiceItem.invoice', function ($query) use ($session) {
                $query->where('session_id', $session->id)
                    ->where('type', 'purchase');
            })->sum('total_diff') ?? 0;

            // Receipts (Commissions) dyal l-achat
            $purchaseReceipts = Receipt::where('session_id', $session->id)
                ->whereHas('items.invoiceItem.invoice', function ($query) {
                    $query->where('type', 'purchase');
                })->sum('total_amount') ?? 0;

            // L-7isab dyal l-Achat (Purchase)
            $session->total_buy = $purchaseInvoicesTotal + $purchaseDifferences + $purchaseReceipts;


            // --- 2. VENTE (Sale) ---
            // Ghadi n-akhdo l-invoices lli l-type dyalhom 'sale'
            $saleInvoicesTotal = Invoice::where('session_id', $session->id)
                ->where('type', 'sale')
                ->sum('amount') ?? 0;

            // Differences dyal l-bi3 (ila t-zad thmen l-bi3 3la l-kelyan)
            $saleDifferences = Difference::whereHas('invoiceItem.invoice', function ($query) use ($session) {
                $query->where('session_id', $session->id)
                    ->where('type', 'sale');
            })->sum('total_diff') ?? 0;

            // Receipts dyal l-bi3
            $saleReceipts = Receipt::where('session_id', $session->id)
                ->whereHas('items.invoiceItem.invoice', function ($query) {
                    $query->where('type', 'sale');
                })->sum('total_amount') ?? 0;

            // L-7isab dyal l-Vente (Sale)
            $session->total_sell = $saleInvoicesTotal + $saleDifferences + $saleReceipts;

            return $session;
        });

        return Inertia::render('sessions', [
            'sessions' => $sessions
        ]);
    }



    public function show(DailySession $session)
    {
        // 1. Njibo l-Invoices dyal had l-session m-farqin
        $purchases = Invoice::where('session_id', $session->id)
            ->where('type', 'purchase')
            ->with(['items.differences', 'items.receiptItems'])
            ->get();

        $sales = Invoice::where('session_id', $session->id)
            ->where('type', 'sale')
            ->with(['items.differences', 'items.receiptItems'])
            ->get();

        // 2. Njibo l-Differences o l-Receipts bla ma n-nsaw l-type (ila kanu direct m-liyyin b session)
        $purchaseDifferences = Difference::whereHas('invoiceItem.invoice', function ($q) use ($session) {
            $q->where('session_id', $session->id)->where('type', 'purchase');
        })->get();

        $saleDifferences = Difference::whereHas('invoiceItem.invoice', function ($q) use ($session) {
            $q->where('session_id', $session->id)->where('type', 'sale');
        })->get();

        // 3. Njibo l-Receipts dyal had l-session
        $purchaseReceipts = Receipt::where('session_id', $session->id)
            ->whereHas('items.invoiceItem.invoice', function ($q) {
                $q->where('type', 'purchase');
            })->get();

        $saleReceipts = Receipt::where('session_id', $session->id)
            ->whereHas('items.invoiceItem.invoice', function ($q) {
                $q->where('type', 'sale');
            })->get();

        return Inertia::render('sessions-show', [
            'session' => $session,
            'purchaseData' => [
                'invoices' => $purchases,
                'differences' => $purchaseDifferences,
                'receipts' => $purchaseReceipts,
                'total' => $purchases->sum('amount') + $purchaseDifferences->sum('total_diff') + $purchaseReceipts->sum('total_amount')
            ],
            'saleData' => [
                'invoices' => $sales,
                'differences' => $saleDifferences,
                'receipts' => $saleReceipts,
                'total' => $sales->sum('amount') + $saleDifferences->sum('total_diff') + $saleReceipts->sum('total_amount')
            ]
        ]);
    }

    public function store(Request $request)
    {
        $formattedDate = Carbon::parse($request->session_date)->startOfDay()->toDateTimeString();

        $request->merge(['session_date' => $formattedDate]);

        $request->validate([
            'session_date' => [
                'required',
                'date',
                \Illuminate\Validation\Rule::unique('daily_sessions', 'session_date')
            ],
        ], [
            'session_date.unique' => 'Une session existe déjà pour cette date.',
        ]);

        DailySession::create([
            'session_date' => $formattedDate,
            'status' => 'open',
            'total_buy' => 0,
            'total_sell' => 0,
        ]);

        return redirect()->back()->with('success', 'Session ouverte avec succès ! 🚀');
    }

    /**
     * Mettre à jour la date de la session
     */
    public function update(Request $request, DailySession $session)
    {
        $validated = $request->validate([
            'session_date' => 'required|date|unique:daily_sessions,session_date,' . $session->id,
        ], [
            'session_date.unique' => 'Impossible : une autre session occupe déjà cette date.',
        ]);

        $session->update($validated);

        return redirect()->back()->with('success', 'Date de la session mise à jour ! ✅');
    }

    /**
     * Clôturer la session (Fixer les montants)
     */
    public function close(DailySession $session)
    {
        $invoicesTotal = Invoice::where('session_id', $session->id)->sum('amount') ?? 0;

        $differencesTotal = Difference::whereHas('invoiceItem.invoice', function ($query) use ($session) {
            $query->where('session_id', $session->id);
        })->sum('total_diff') ?? 0;

        $receiptsTotal = Receipt::where('session_id', $session->id)->sum('total_amount') ?? 0;

        $session->update([
            'status' => 'closed',
            'total_sell' => $invoicesTotal + $differencesTotal + $receiptsTotal,
            'closed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Session clôturée avec succès ! 🔒');
    }

    public function destroy(DailySession $session)
    {
        if ($session->status === 'closed') {
            return redirect()->back()->with('error', 'Impossible de supprimer une session clôturée. 🔒');
        }

        // Vérification des dépendances (Invoices ou Receipts)
        $hasActivity = Invoice::where('session_id', $session->id)->exists() ||
            Receipt::where('session_id', $session->id)->exists();

        if ($hasActivity) {
            return redirect()->back()->with('error', 'Impossible de supprimer : cette session contient déjà des opérations. ⚠️');
        }

        $session->delete();

        return redirect()->back()->with('success', 'Session supprimée avec succès ! 🗑️');
    }
}
