<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DailySession;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\SessionZone;
use App\Models\Zone;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DailySessionController extends Controller
{
    /**
     * Afficher la liste des sessions avec calcul dynamique
     */
    public function index()
    {
        // 1. جلب كاع المناطق المتاحة (للمقترحات في Dialog)
        $zones = Zone::all(['id', 'name']);

        // 2. جلب الـ Sessions مع الـ Zones المرتبطة بها
        $sessions = DailySession::with('zones') // ضروري نزيدو هادي باش EditDialog يعرف الـ selected zones
            ->latest('session_date')
            ->get()
            ->map(function ($session) {

                // --- 1. ACHAT (Purchase) ---
                $purchaseInvoicesTotal = Invoice::where('session_id', $session->id)
                    ->where('type', 'purchase')
                    ->sum('amount') ?? 0;

                $purchaseDifferences = Difference::whereHas('invoiceItem.invoice', function ($q) use ($session) {
                    $q->where('session_id', $session->id)->where('type', 'purchase');
                })->sum('total_diff') ?? 0;

                $purchaseReceipts = Receipt::where('session_id', $session->id)
                    ->whereHas('items.invoiceItem.invoice', function ($q) {
                        $q->where('type', 'purchase');
                    })->sum('total_amount') ?? 0;

                $session->total_buy = $purchaseInvoicesTotal + $purchaseDifferences + $purchaseReceipts;

                // --- 2. VENTE (Sale) ---
                $saleInvoicesTotal = Invoice::where('session_id', $session->id)
                    ->where('type', 'sale')
                    ->sum('amount') ?? 0;

                $saleDifferences = Difference::whereHas('invoiceItem.invoice', function ($q) use ($session) {
                    $q->where('session_id', $session->id)->where('type', 'sale');
                })->sum('total_diff') ?? 0;

                $saleReceipts = Receipt::where('session_id', $session->id)
                    ->whereHas('items.invoiceItem.invoice', function ($q) {
                        $q->where('type', 'sale');
                    })->sum('total_amount') ?? 0;

                $session->total_sell = $saleInvoicesTotal + $saleDifferences + $saleReceipts;
 
                return $session;
            });

        return Inertia::render('sessions', [
            'sessions' => $sessions,
            'zones'    => $zones,
            // غادي نحتاجو حتى التواريخ اللي ديجا محجوزة باش نـبلوكيوهم في الـ Calendar
            'existingDates' => $sessions->pluck('session_date')->toArray(),
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
        // 1. تسييق التاريخ
        $formattedDate = Carbon::parse($request->session_date)->startOfDay()->toDateTimeString();
        $request->merge(['session_date' => $formattedDate]);

        // 2. Validation (تأكدنا من التاريخ والمناطق المختارة)
        $validated = $request->validate([
            'session_date' => [
                'required',
                'date',
                \Illuminate\Validation\Rule::unique('daily_sessions', 'session_date')
            ],
            'selected_zones' => 'required|array|min:1', // ضروري يختار منطقة وحدة على الأقل
            'selected_zones.*' => 'exists:zones,id',    // تأكد أن الـ IDs كاينين في جدول zones
        ], [
            'session_date.unique' => 'Une session existe déjà pour cette date.',
            'selected_zones.required' => 'Veuillez sélectionner au moins une zone.',
        ]);

        // 3. التسجيل وسط Transaction لضمان الأمان
        DB::transaction(function () use ($formattedDate, $validated) {
            // إنشاء الحصة
            $session = DailySession::create([
                'session_date' => $formattedDate,
                'status'       => 'open',
                'total_buy'    => 0,
                'total_sell'   => 0,
            ]);

            // إنشاء السجلات في الجدول الوسيط SessionZone
            foreach ($validated['selected_zones'] as $zoneId) {
                SessionZone::create([
                    'daily_session_id' => $session->id,
                    'zone_id'          => $zoneId,
                    'total_buy'        => 0,
                    'total_sell'       => 0,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Session et zones ouvertes avec succès ! 🚀');
    }

    /**
     * Mettre à jour la date de la session et les zones associées
     */
    public function update(Request $request, DailySession $session)
    {
        $formattedDate = \Carbon\Carbon::parse($request->session_date)->startOfDay()->toDateTimeString();

        $request->merge(['session_date' => $formattedDate]);

        $validated = $request->validate([
            'session_date'   => 'required|date|unique:daily_sessions,session_date,' . $session->id,
            'selected_zones' => 'required|array|min:1',
            'selected_zones.*' => 'exists:zones,id',
        ]);

        // $currentZoneIds = $session->sessionZones()->pluck('zone_id')->toArray();
        $currentZoneIds = $session->sessionZones()->withTrashed()->pluck('zone_id')->toArray();

        $zonesToRemove = array_diff($currentZoneIds, $validated['selected_zones']);

        foreach ($zonesToRemove as $zoneId) {
            $zoneStats = $session->sessionZones()->where('zone_id', $zoneId)->first();

            // Check if zone has transactions
            $hasInvoices = \App\Models\Invoice::where('session_id', $session->id)->where('zone_id', $zoneId)->exists();

            $hasReceipts = \App\Models\Receipt::where('session_id', $session->id)
                ->whereHas('items', fn($q) => $q->where('zone_id', $zoneId))->exists();

            if (($zoneStats && ($zoneStats->total_buy > 0 || $zoneStats->total_sell > 0)) || $hasInvoices || $hasReceipts) {
                $zoneName = \App\Models\Zone::find($zoneId)->name;
                return back()->withErrors(['selected_zones' => "Impossible de retirer '$zoneName' : contient des données."]);
            }
        }

        DB::transaction(function () use ($session, $validated) {
            $session->update(['session_date' => $validated['session_date']]);

            $session->zones()->syncWithPivotValues($validated['selected_zones'], [
                'updated_at' => now(),
                'created_at' => now(),
            ], false);

            // $session->sessionZones()->whereNotIn('zone_id', $validated['selected_zones'])->delete();
            $session->sessionZones()->whereNotIn('zone_id', $validated['selected_zones'])->forceDelete();
        });

        return redirect()->back()->with('success', 'Session mise à jour !');
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
