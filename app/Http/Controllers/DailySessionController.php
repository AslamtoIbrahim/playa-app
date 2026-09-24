<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Boat;
use App\Models\Caution;
use App\Models\Company;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\OfficeRoom;
use App\Models\Receipt;
use App\Models\Sale;
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
                // Les factures / bons / pointages sont rattachés au SessionZone, pas directement à la session.
                $sessionZoneIds = $session->sessionZones()->pluck('id')->all();

                // Totaux de la journée : factures + différences + réceptions
                // (+ masse salariale des ouvriers côté achats).
                $totals = $this->sessionTotals($sessionZoneIds);

                $session->total_buy = $totals['buy'];
                $session->total_sell = $totals['sell'];

                return $session;
            });

        return Inertia::render('sessions', [
            'sessions' => $sessions,
            'zones' => $zones,
            // غادي نحتاجو حتى التواريخ اللي ديجا محجوزة باش نـبلوكيوهم في الـ Calendar
            // 'existingDates' => $sessions->pluck('session_date')->toArray(),
        ]);
    }

    public function show(DailySession $session)
    {
        $session->load(['zones', 'sessionZones.zone']);

        // Les factures / bons / pointages sont rattachés au SessionZone (session_zone_id),
        // il n'existe plus de colonne session_id sur invoices / receipts / attendances.
        $sessionZoneIds = $session->sessionZones->pluck('id')->all();

        // 1. Achats data
        $purchases = Invoice::whereIn('session_zone_id', $sessionZoneIds)
            ->where('type', 'purchase')
            ->with(['items.differences', 'items.receiptItems', 'items.item', 'items.boat', 'billable', 'caution', 'sessionZone.zone'])
            ->get();

        $purchaseDifferences = Difference::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'purchase');
        })->with(['item', 'customer', 'invoiceItem.invoice', 'invoiceItem.boat'])->get();

        // Les bons sans lien facture sont visibles côté achats : bons vides
        // (à peine créés) et bons à saisie directe (items sans invoice_item_id).
        $purchaseReceipts = Receipt::whereIn('session_zone_id', $sessionZoneIds)
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->whereDoesntHave('items')
                        ->orWhereHas('items', function ($i) {
                            $i->whereNull('invoice_item_id');
                        });
                })->orWhereHas('items.invoiceItem.invoice', function ($q2) {
                    $q2->where('type', 'purchase');
                });
            })->with(['items.invoiceItem.invoice', 'customer', 'boat', 'sessionZone.zone'])->get();

        // 2. Ventes data & tracking
        $sales = Sale::where('session_id', $session->id)
            ->with(['customer', 'items.item', 'items.boat'])
            ->get();

        $saleInvoices = Invoice::whereIn('session_zone_id', $sessionZoneIds)
            ->where('type', 'sale')
            ->with(['items.differences', 'items.receiptItems', 'items.item', 'items.boat', 'billable', 'caution', 'sessionZone.zone'])
            ->get();

        $saleDifferences = Difference::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'sale');
        })->with(['item', 'customer', 'invoiceItem.invoice', 'invoiceItem.boat'])->get();

        $saleReceipts = Receipt::whereIn('session_zone_id', $sessionZoneIds)
            ->whereHas('items.invoiceItem.invoice', function ($q) {
                $q->where('type', 'sale');
            })->with(['items.invoiceItem.invoice', 'customer', 'boat', 'sessionZone.zone'])->get();

        // 3. Ouvries (Attendance / Workers)
        $attendances = Attendance::whereIn('session_zone_id', $sessionZoneIds)
            ->with(['items.worker', 'sessionZone.zone'])
            ->get();

        // 4. Totals calculation
        //    Le total d'achat inclut la masse salariale des pointages (charge
        //    ouvriers) : c'est la même formule que la liste des journées.
        $totals = $this->sessionTotals($sessionZoneIds);

        // 5. Données du dialogue de création de facture.
        //    La journée, la zone et la date sont déjà connues : on n'envoie que le reste.
        $customers = Customer::select('id', 'name')->get()->map(fn ($customer) => [
            'id' => $customer->id,
            'name' => $customer->name,
            'type' => Customer::class,
        ]);

        $companies = Company::select('id', 'name')->get()->map(fn ($company) => [
            'id' => $company->id,
            'name' => $company->name,
            'type' => Company::class,
        ]);

        return Inertia::render('sessions-show', [
            'session' => $session,
            'purchaseData' => [
                'invoices' => $purchases,
                'differences' => $purchaseDifferences,
                'receipts' => $purchaseReceipts,
                'total' => $totals['buy'],
            ],
            'saleData' => [
                'sales' => $sales,
                'invoices' => $saleInvoices,
                'differences' => $saleDifferences,
                'receipts' => $saleReceipts,
                'total' => $totals['sell'],
            ],
            'attendances' => $attendances,
            'totals' => [
                'buy' => $totals['buy'],
                'sell' => $totals['sell'],
                'margin' => $totals['margin'],
                // Détail de la part ouvriers du total d'achat (masse salariale).
                'attendance' => $totals['attendance'],
            ],

            // Données du dialogue de création de facture depuis la journée
            'billables' => $customers->concat($companies),
            'officeRooms' => OfficeRoom::all(['id', 'name', 'city']),
            'cautions' => Caution::select('id', 'name', 'owner_id', 'owner_type')->get(),
            'sessionZones' => $session->sessionZones()
                ->with(['zone:id,name', 'dailySession:id,session_date,status'])
                ->get(['id', 'daily_session_id', 'zone_id']),

            // Données du dialogue de création de bon de réception depuis la journée
            'customers' => Customer::all(['id', 'name']),
            'boats' => Boat::all(['id', 'name']),
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
            ],
            'selected_zones' => 'required|array|min:1', // ضروري يختار منطقة وحدة على الأقل
            'selected_zones.*' => 'exists:zones,id',    // تأكد أن الـ IDs كاينين في جدول zones
        ], [
            'session_date.required' => 'La date de la session est obligatoire.',
            'selected_zones.required' => 'Veuillez sélectionner au moins une zone.',
        ]);

        // 3. Check uniqueness combination of (session_date + zone_id)
        foreach ($validated['selected_zones'] as $zoneId) {
            $exists = SessionZone::where('zone_id', $zoneId)
                ->whereHas('dailySession', function ($q) use ($formattedDate) {
                    $q->where('session_date', $formattedDate);
                })
                ->exists();

            if ($exists) {
                $zoneName = Zone::find($zoneId)->name ?? 'cette zone';

                return back()->withErrors(['selected_zones' => "Une journée existe déjà pour la zone '$zoneName' à cette date."]);
            }
        }

        // 4. التسجيل وسط Transaction لضمان الأمان
        DB::transaction(function () use ($formattedDate, $validated) {
            // إنشاء الحصة
            $session = DailySession::create([
                'session_date' => $formattedDate,
                'status' => 'open',
                'total_buy' => 0,
                'total_sell' => 0,
            ]);

            // إنشاء السجلات في الجدول الوسيط SessionZone
            foreach ($validated['selected_zones'] as $zoneId) {
                SessionZone::create([
                    'daily_session_id' => $session->id,
                    'zone_id' => $zoneId,
                    'total_buy' => 0,
                    'total_sell' => 0,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Journée et zones ouvertes avec succès ! 🚀');
    }

    /**
     * Mettre à jour la date de la session et les zones associées
     */
    public function update(Request $request, DailySession $session)
    {
        $formattedDate = Carbon::parse($request->session_date)->startOfDay()->toDateTimeString();

        $request->merge(['session_date' => $formattedDate]);

        $validated = $request->validate([
            'session_date' => 'required|date',
            'selected_zones' => 'required|array|min:1',
            'selected_zones.*' => 'exists:zones,id',
        ]);

        // Check uniqueness combination of (session_date + zone_id) excluding current session
        foreach ($validated['selected_zones'] as $zoneId) {
            $exists = SessionZone::where('zone_id', $zoneId)
                ->where('daily_session_id', '!=', $session->id)
                ->whereHas('dailySession', function ($q) use ($formattedDate) {
                    $q->where('session_date', $formattedDate);
                })
                ->exists();

            if ($exists) {
                $zoneName = Zone::find($zoneId)->name ?? 'cette zone';

                return back()->withErrors(['selected_zones' => "Une journée existe déjà pour la zone '$zoneName' à cette date."]);
            }
        }

        // $currentZoneIds = $session->sessionZones()->pluck('zone_id')->toArray();
        $currentZoneIds = $session->sessionZones()->withTrashed()->pluck('zone_id')->toArray();

        $zonesToRemove = array_diff($currentZoneIds, $validated['selected_zones']);

        foreach ($zonesToRemove as $zoneId) {
            $zoneStats = $session->sessionZones()->where('zone_id', $zoneId)->first();

            // Check if zone has transactions
            $hasInvoices = Invoice::where('session_id', $session->id)->where('zone_id', $zoneId)->exists();

            $hasReceipts = Receipt::where('session_id', $session->id)
                ->whereHas('items', fn ($q) => $q->where('zone_id', $zoneId))->exists();

            if (($zoneStats && ($zoneStats->total_buy > 0 || $zoneStats->total_sell > 0)) || $hasInvoices || $hasReceipts) {
                $zoneName = Zone::find($zoneId)->name;

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
        $sessionZoneIds = $session->sessionZones()->pluck('id')->all();

        // Même formule que la fiche de la journée : les montants figés à la
        // clôture correspondent exactement à ce qui était affiché.
        $totals = $this->sessionTotals($sessionZoneIds);

        $session->update([
            'status' => 'closed',
            'total_buy' => $totals['buy'],
            'total_sell' => $totals['sell'],
            'closed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Session clôturée avec succès ! 🔒');
    }

    /**
     * Totaux financiers d'une journée.
     *
     * Le total d'achat cumule les factures d'achat, leurs différences et les
     * bons de réception, puis y ajoute la masse salariale des pointages : les
     * ouvriers sont une charge de la journée. Le total de vente suit la même
     * logique côté vente, sans charge.
     *
     * @param  array<int, int>  $sessionZoneIds
     * @return array{purchase: float, sale: float, attendance: float, buy: float, sell: float, margin: float}
     */
    private function sessionTotals(array $sessionZoneIds): array
    {
        $purchaseInvoices = (float) Invoice::whereIn('session_zone_id', $sessionZoneIds)
            ->where('type', 'purchase')
            ->sum('amount');

        $purchaseDifferences = (float) Difference::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'purchase');
        })->sum('total_diff');

        // Les bons sans lien facture (bons vides ou à saisie directe) sont
        // comptés côté achats, comme dans l'onglet Réceptions.
        $purchaseReceipts = (float) Receipt::whereIn('session_zone_id', $sessionZoneIds)
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->whereDoesntHave('items')
                        ->orWhereHas('items', function ($i) {
                            $i->whereNull('invoice_item_id');
                        });
                })->orWhereHas('items.invoiceItem.invoice', function ($q2) {
                    $q2->where('type', 'purchase');
                });
            })->sum('total_amount');

        $saleInvoices = (float) Invoice::whereIn('session_zone_id', $sessionZoneIds)
            ->where('type', 'sale')
            ->sum('amount');

        $saleDifferences = (float) Difference::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'sale');
        })->sum('total_diff');

        $saleReceipts = (float) Receipt::whereIn('session_zone_id', $sessionZoneIds)
            ->whereHas('items.invoiceItem.invoice', function ($q) {
                $q->where('type', 'sale');
            })->sum('total_amount');

        // Masse salariale des feuilles de pointage (les pointages supprimés,
        // donc soft-deleted, sont automatiquement exclus).
        $attendanceWages = (float) Attendance::whereIn('session_zone_id', $sessionZoneIds)->sum('total_wage');

        $purchase = $purchaseInvoices + $purchaseDifferences + $purchaseReceipts;
        $sale = $saleInvoices + $saleDifferences + $saleReceipts;
        $buy = $purchase + $attendanceWages;

        return [
            'purchase' => $purchase,
            'sale' => $sale,
            'attendance' => $attendanceWages,
            'buy' => $buy,
            'sell' => $sale,
            'margin' => $sale - $buy,
        ];
    }

    public function destroy(DailySession $session)
    {
        if ($session->status === 'closed') {
            return redirect()->back()->with('error', 'Impossible de supprimer une session clôturée. 🔒');
        }

        // Vérification des dépendances (Invoices / Receipts / Pointages / Ventes)
        $sessionZoneIds = $session->sessionZones()->pluck('id')->all();

        $hasActivity = Invoice::whereIn('session_zone_id', $sessionZoneIds)->exists() ||
            Receipt::whereIn('session_zone_id', $sessionZoneIds)->exists() ||
            Attendance::whereIn('session_zone_id', $sessionZoneIds)->exists() ||
            Sale::where('session_id', $session->id)->exists();

        if ($hasActivity) {
            return redirect()->back()->with('error', 'Impossible de supprimer : cette session contient déjà des opérations. ️');
        }

        $session->delete();

        return redirect()->back()->with('success', 'Session supprimée avec succès ! 🗑️');
    }
}
