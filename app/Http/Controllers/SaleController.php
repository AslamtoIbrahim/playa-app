<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Boat;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SaleController extends Controller
{
    /**
     * Afficher la liste des ventes
     */
    public function index()
    {
        return Inertia::render('sales', [
            'sales' => Sale::with(['customer', 'session'])
                ->latest()
                ->paginate(15),
            'customers' => Customer::select('id', 'name')->get(),
            'sessions'  => DailySession::where('status', 'open')->latest()->get(['id', 'session_date']),
        ]);
    }

    /**
     * Créer une nouvelle vente (Header)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'        => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'session_id'  => 'required|exists:daily_sessions,id',
            'type'        => 'required|in:normal,usine',
        ]);

        $session = DailySession::findOrFail($validated['session_id']);

        if ($session->status === 'closed') {
            return back()->withErrors(['session_id' => "Action impossible : La session est clôturée."]);
        }

        $sale = Sale::create([
            'date'        => $validated['date'],
            'customer_id' => $validated['customer_id'],
            'session_id'  => $validated['session_id'],
            'type'        => $validated['type'],
            'created_by'  => $request->user()->id,
            'amount'      => 0,
            'boxes'       => 0,
            'weight'      => 0,
        ]);

        return redirect()->route('sales.show', $sale->id)
            ->with('success', "Opération de vente créée avec succès.");
    }

    /**
     * Afficher les détails d'une vente et ajouter des items
     */
    public function show(Sale $sale)
    {
        $sale->load(['customer', 'session', 'items.item', 'items.boat']);

        return Inertia::render('sales-show', [
            'sale'      => $sale,
            'boats'     => Boat::select('id', 'name')->get(),
            'items'     => Item::select('id', 'name')->get(),
        ]);
    }

    /**
     * Mettre à jour les infos de base
     */
    public function update(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'date'        => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'type'        => 'required|in:normal,usine',
        ]);

        $sale->update($validated);

        return back()->with('success', "Vente mise à jour.");
    }

    /**
     * Supprimer une vente (Soft Delete)
     */
    public function destroy(Sale $sale)
    {
        // Nafss l-security li derti f Invoice
        if ($sale->amount > 0) {
            return back()->with('error', "Suppression impossible : Cette vente contient déjà des lignes.");
        }

        DB::transaction(function () use ($sale) {
            $sale->items()->delete();
            $sale->delete();
        });

        return back()->with('success', "Vente supprimée.");
    }
}