<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Sale;
use App\Models\SaleItem;
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
            'sessions' => DailySession::where('status', 'open')->latest()->get(['id', 'session_date']),
        ]);
    }

    /**
     * Créer une nouvelle vente (Header)
     *
     * `redirect=back` keeps the caller on the current page (sale created from
     * the invoice distribution dialog); the default lands on the new sale's
     * sheet so its items can be filled in.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'session_id' => 'required|exists:daily_sessions,id',
            'type' => 'required|in:normal,usine',
            'redirect' => 'sometimes|in:back,show',
        ], [
            'date.required' => 'La date est obligatoire.',
            'date.date' => 'La date est invalide.',
            'customer_id.required' => 'Veuillez choisir un client.',
            'customer_id.exists' => "Ce client n'existe pas.",
            'session_id.required' => 'La journée est obligatoire.',
            'session_id.exists' => "Cette journée n'existe pas.",
            'type.required' => 'Le type de vente est obligatoire.',
            'type.in' => 'Le type de vente est invalide.',
            'redirect.in' => 'Paramètre de redirection invalide.',
        ]);

        $session = DailySession::findOrFail($validated['session_id']);

        if ($session->status === 'closed') {
            return back()->withErrors(['session_id' => 'Action impossible : La session est clôturée.']);
        }

        $sale = Sale::create([
            'date' => $validated['date'],
            'customer_id' => $validated['customer_id'],
            'session_id' => $validated['session_id'],
            'type' => $validated['type'],
            'created_by' => $request->user()->id,
            'amount' => 0,
            'boxes' => 0,
            'weight' => 0,
        ]);

        if (($validated['redirect'] ?? 'show') === 'back') {
            return back()->with('success', 'Vente créée avec succès.');
        }

        return redirect()->route('sales.show', $sale->id)
            ->with('success', 'Opération de vente créée avec succès.');
    }

    /**
     * Afficher les détails d'une vente et ajouter des items
     *
     * Une vente est rattachée à une journée et non à une zone : ses zones sont
     * donc déduites des factures d'achat d'origine de ses lignes. La
     * distribution n'imposant que la journée commune, une vente peut théoriquement
     * réunir plusieurs zones : la liste renvoyée est donc dédupliquée.
     */
    public function show(Sale $sale)
    {
        $sale->load([
            'customer',
            'session',
            'items.invoiceItem.item',
            'items.invoiceItem.boat',
            'items.invoiceItem.invoice',
            'items.invoiceItem.invoice.sessionZone.zone',
            'items.invoiceItem.invoice.sessionZone.dailySession',
        ]);

        // Filter out sale items whose invoice item is soft-deleted
        $sale->items = $sale->items->filter(function ($item) {
            return ! is_null($item->invoiceItem) && ! is_null($item->invoiceItem->fresh());
        })->values();

        $sessionZones = $sale->items
            ->map(fn (SaleItem $saleItem) => $saleItem->invoiceItem?->invoice?->sessionZone)
            ->filter()
            ->unique('id')
            ->values();

        return Inertia::render('sales-show', [
            'sale' => $sale,
            'sessionZones' => $sessionZones,
        ]);
    }

    /**
     * Mettre à jour les infos de base
     */
    public function update(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'type' => 'required|in:normal,usine',
        ]);

        $sale->update($validated);

        return back()->with('success', 'Vente mise à jour.');
    }

    /**
     * Supprimer une vente (Soft Delete)
     */
    public function destroy(Sale $sale)
    {
        // Nafss l-security li derti f Invoice
        if ($sale->amount > 0) {
            return back()->with('error', 'Suppression impossible : Cette vente contient déjà des lignes.');
        }

        DB::transaction(function () use ($sale) {
            $sale->items()->delete();
            $sale->delete();
        });

        return back()->with('success', 'Vente supprimée.');
    }
}
