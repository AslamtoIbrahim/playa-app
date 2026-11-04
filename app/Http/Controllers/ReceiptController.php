<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Item;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleCharge;
use App\Models\SessionZone;
use App\Models\Usine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    /**
     * Afficher la liste des bons (Receipts)
     */
    public function index()
    {
        $receipts = Receipt::with(['customer', 'sessionZone.dailySession', 'sessionZone.zone', 'boat'])
            ->latest()
            ->paginate(10);

        return Inertia::render('receipts', [
            'receipts' => $receipts,
        ]);
    }

    /**
     * Créer un nouveau bon
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'session_zone_id' => 'required|exists:session_zones,id',
            'boat_id' => 'nullable|exists:boats,id',
            'from_session' => 'nullable|integer|exists:daily_sessions,id',
        ]);

        $sessionZone = SessionZone::with('dailySession')->findOrFail($validated['session_zone_id']);

        if ($sessionZone->dailySession->status === 'closed') {
            return back()->withErrors(['session_zone_id' => 'Action impossible : La session الرئيسية  مغلقة.']);
        }

        return DB::transaction(function () use ($validated, $sessionZone) {
            $receipt = Receipt::create([
                'date' => $validated['date'],
                'customer_id' => $validated['customer_id'],
                'session_zone_id' => $validated['session_zone_id'],
                'boat_id' => $validated['boat_id'] ?? null,
                'quantity' => 0,
                'total_amount' => 0,
                'total_boxes' => 0,
            ]);

            // Preserve the session origin so the receipt detail can link back to it.
            if (isset($validated['from_session']) && (int) $validated['from_session'] === $sessionZone->daily_session_id) {
                return redirect()->route('receipts.show', [
                    'receipt' => $receipt->id,
                    'from_session' => $sessionZone->daily_session_id,
                ])->with('success', 'Bon créé avec succès.');
            }

            return redirect()->route('receipts.show', $receipt->id)
                ->with('success', 'Bon créé avec succès.');
        });
    }

    /** Sell the remaining balance of every receipt in a session to one owner. */
    public function sellAll(Request $request)
    {
        $ownerTable = $request->input('type') === 'usine' ? 'usines' : 'customers';
        $validated = $request->validate([
            'session_id' => 'required|exists:daily_sessions,id',
            'owner_id' => ['required', 'integer', Rule::exists($ownerTable, 'id')],
            'type' => 'required|in:normal,usine',
        ], [
            'owner_id.required' => 'Veuillez choisir un client ou une usine.',
            'owner_id.exists' => "Le client ou l'usine sélectionné n'existe pas.",
            'type.in' => 'Le type de vente est invalide.',
        ]);

        $ownerClass = $validated['type'] === 'usine' ? Usine::class : Customer::class;

        $session = DailySession::findOrFail($validated['session_id']);

        if ($session->status === 'closed') {
            return back()->with('error', 'Action impossible : La journée est clôturée.');
        }

        $result = DB::transaction(function () use ($request, $validated, $session, $ownerClass) {
            $receipts = Receipt::query()
                ->whereHas('sessionZone', fn ($query) => $query->where('daily_session_id', $session->id))
                ->withSum('saleCharges', 'amount')
                ->lockForUpdate()
                ->get();

            $remainingReceipts = $receipts->map(function ($receipt) {
                return [$receipt, max((float) $receipt->total_amount - (float) ($receipt->sale_charges_sum_amount ?? 0), 0)];
            })->filter(fn ($entry) => $entry[1] > 0.005);

            if ($remainingReceipts->isEmpty()) {
                return null;
            }

            $sale = Sale::where('session_id', $session->id)
                ->where('owner_id', $validated['owner_id'])
                ->where('owner_type', $ownerClass)
                ->latest('id')
                ->first();

            if (! $sale) {
                $sale = Sale::create([
                    'date' => $session->session_date,
                    'owner_id' => $validated['owner_id'],
                    'owner_type' => $ownerClass,
                    'session_id' => $session->id,
                    'created_by' => $request->user()->id,
                    'type' => $validated['type'],
                    'amount' => 0,
                    'boxes' => 0,
                    'weight' => 0,
                ]);
            }

            foreach ($remainingReceipts as [$receipt, $remaining]) {
                $charge = SaleCharge::withTrashed()
                    ->where('sale_id', $sale->id)
                    ->where('receipt_id', $receipt->id)
                    ->first();

                if ($charge?->trashed()) {
                    $charge->forceDelete();
                    $charge = null;
                }

                if ($charge) {
                    $charge->amount = (float) $charge->amount + $remaining;
                    $charge->save();
                } else {
                    SaleCharge::create([
                        'sale_id' => $sale->id,
                        'receipt_id' => $receipt->id,
                        'amount' => $remaining,
                    ]);
                }
            }

            return [$sale, $remainingReceipts->count()];
        });

        if (! $result) {
            return back()->with('error', 'Aucun bon ne reste à vendre pour cette journée.');
        }

        return back()->with('success', "{$result[1]} bon(s) vendu(s) à {$result[0]->owner->name}.");
    }

    /**
     * Afficher les détails d'un bon
     */
    public function show(Request $request, Receipt $receipt)
    {
        $receipt->load(['customer', 'sessionZone.dailySession', 'sessionZone.zone', 'boat', 'items.item']);

        $session = $receipt->sessionZone?->dailySession;
        $openedFromSession = $session !== null
            && $request->integer('from_session') === $session->id;

        $backUrl = $openedFromSession
            ? route('sessions.show', [$session->id])
            : route('receipts');

        return Inertia::render('receipts-show', [
            'receipt' => $receipt,
            'items' => Item::all(['id', 'name']),
            'backUrl' => $backUrl,
        ]);
    }

    /**
     * Mettre à jour les infos du bon
     */
    public function update(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'session_zone_id' => 'required|exists:session_zones,id',
            'boat_id' => 'nullable|exists:boats,id',
        ]);

        $sessionZone = SessionZone::with('dailySession')->findOrFail($validated['session_zone_id']);

        if ($sessionZone->dailySession->status === 'closed' && $receipt->session_zone_id !== (int) $validated['session_zone_id']) {
            return back()->withErrors(['session_zone_id' => 'Transfert impossible : La session الرئيسية  المستهدفة مغلقة.']);
        }

        $receipt->update($validated);

        return back()->with('success', 'Bon mis à jour.');
    }

    /**
     * Supprimer un bon (Soft Delete).
     *
     * Un bon vide (sans articles et sans montant) peut être supprimé même s'il
     * possède encore des SaleCharges : celles-ci seront supprimées au préalable,
     * ce qui déclenche automatiquement le recalcul des ventes associées via
     * l'événement `deleted` du modèle SaleCharge.
     */
    public function destroy(Receipt $receipt)
    {
        // Bloquer la suppression si le bon contient encore des articles ou un montant.
        if ($receipt->items()->count() > 0 || $receipt->total_amount > 0) {
            return back()->with('error', 'Suppression impossible : Ce bon contient encore des articles ou un montant non nul.');
        }

        try {
            DB::beginTransaction();

            // Supprimer les SaleCharges liées (recalcul de la vente via l'événement deleted).
            foreach ($receipt->saleCharges as $charge) {
                $charge->delete();
            }

            // Supprimer les articles résiduels (cas défensif).
            $receipt->items()->delete();

            $receipt->delete();

            DB::commit();

            return back()->with('success', 'Le bon a été supprimé avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Erreur technique : '.$e->getMessage());
        }
    }
}
