<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\SessionZone;
use App\Models\Boat;
use App\Models\Item;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    /**
     * Afficher la liste des bons (Receipts)
     */
    public function index()
    {
        $receipts = Receipt::with(['customer', 'sessionZone', 'boat'])
            ->latest()
            ->paginate(10);

        $customers = Customer::all(['id', 'name']);

        $sessionZones = SessionZone::with('dailySession')
            ->whereHas('dailySession', function ($query) {
                $query->where('status', 'open');
            })
            ->latest()
            ->get(['id', 'zone_id', 'daily_session_id']);

        $boats = Boat::all(['id', 'name']);

        return Inertia::render('receipts', [
            'receipts'  => $receipts,
            'customers' => $customers,
            'sessionZones'  => $sessionZones->map(function ($sessionZone) {
                return [
                    'id' => $sessionZone->id,
                    'name' => $sessionZone->dailySession->session_date->format('Y-m-d') . ' - Zone ' . $sessionZone->zone_id,
                ];
            }),
            'boats'     => $boats,
        ]);
    }

    /**
     * Créer un nouveau bon
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'        => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'session_zone_id'  => 'required|exists:session_zones,id',
            'boat_id'     => 'nullable|exists:boats,id',
        ]);

        $sessionZone = SessionZone::with('dailySession')->findOrFail($validated['session_zone_id']);

        if ($sessionZone->dailySession->status === 'closed') {
            return back()->withErrors(['session_zone_id' => "Action impossible : La session الرئيسية  مغلقة."]);
        }

        return DB::transaction(function () use ($validated) {
            $receipt = Receipt::create([
                'date'         => $validated['date'],
                'customer_id'  => $validated['customer_id'],
                'session_zone_id'   => $validated['session_zone_id'],
                'boat_id'      => $validated['boat_id'] ?? null,
                'quantity'     => 0,
                'total_amount' => 0,
                'total_boxes'  => 0,
            ]);

            return redirect()->route('receipts.show', $receipt->id)
                ->with('success', "Bon créé avec succès.");
        });
    }

    /**
     * Afficher les détails d'un bon
     */
    public function show(Receipt $receipt)
    {
        $receipt->load(['customer', 'sessionZone.dailySession', 'boat', 'items.item']);

        return Inertia::render('receipts-show', [
            'receipt' => $receipt,
            'items'   => Item::all(['id', 'name']),
        ]);
    }

    /**
     * Mettre à jour les infos du bon
     */
    public function update(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'date'        => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'session_zone_id'  => 'required|exists:session_zones,id',
            'boat_id'     => 'nullable|exists:boats,id',
        ]);

        $sessionZone = SessionZone::with('dailySession')->findOrFail($validated['session_zone_id']);

        if ($sessionZone->dailySession->status === 'closed' && $receipt->session_zone_id !== (int)$validated['session_zone_id']) {
            return back()->withErrors(['session_zone_id' => "Transfert impossible : La session الرئيسية  المستهدفة مغلقة."]);
        }

        $receipt->update($validated);

        return back()->with('success', "Bon mis à jour.");
    }

    /**
     * Supprimer un bon (Soft Delete)
     */
    public function destroy(Receipt $receipt)
    {
        if ($receipt->items()->count() > 0 || $receipt->total_amount > 0) {
            return back()->with('error', "Suppression impossible : Ce bon contient des données.");
        }

        try {
            DB::beginTransaction();

            $receipt->items()->delete();

            $receipt->delete();

            DB::commit();

            return back()->with('success', "Le bon a été archivé avec succès.");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', "Erreur technique : " . $e->getMessage());
        }
    }
}
