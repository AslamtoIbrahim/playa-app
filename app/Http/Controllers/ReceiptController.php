<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DailySession;
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
        $receipts = Receipt::with(['customer', 'session', 'boat'])
            ->latest()
            ->paginate(10);

        $customers = Customer::all(['id', 'name']);

        $sessions = DailySession::where('status', 'open')
            ->latest()
            ->get(['id', 'session_date']);
            
        $boats = Boat::all(['id', 'name']);

        return Inertia::render('receipts', [
            'receipts'  => $receipts,
            'customers' => $customers,
            'sessions'  => $sessions,
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
            'session_id'  => 'required|exists:daily_sessions,id',
            'boat_id'     => 'nullable|exists:boats,id',
        ]);

        $session = DailySession::findOrFail($validated['session_id']);

        if ($session->status === 'closed') {
            return back()->withErrors(['session_id' => "Action impossible : La session est clôturée."]);
        }

        return DB::transaction(function () use ($validated) {
            $receipt = Receipt::create([
                'date'         => $validated['date'],
                'customer_id'  => $validated['customer_id'],
                'session_id'   => $validated['session_id'],
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
        // كنحملو الـ boat هنا باش يبان فـ الـ Header ديال Show
        $receipt->load(['customer', 'session', 'boat', 'items.item']);

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
            'session_id'  => 'required|exists:daily_sessions,id',
            'boat_id'     => 'nullable|exists:boats,id',
        ]);

        $session = DailySession::findOrFail($validated['session_id']);

        if ($session->status === 'closed' && $receipt->session_id !== (int)$validated['session_id']) {
            return back()->withErrors(['session_id' => "Transfert impossible : La session cible est clôturée."]);
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