<?php

namespace App\Http\Controllers;

use App\Models\Boat;
use App\Models\Company;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\OfficeRoom;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices
     */
    public function index()
    {
        $invoices = Invoice::with(['billable', 'officeRoom'])
            // ->withSum('payments as total_paid', 'amount')
            ->latest()
            ->paginate(10);

        $customers = Customer::select('id', 'name')->get()->map(fn($c) => [
            'id'    => $c->id,
            'name'  => $c->name,
            'type'  => Customer::class,
            'label' => 'Client: ' . $c->name
        ]);

        $companies = Company::select('id', 'name')->get()->map(fn($c) => [
            'id'    => $c->id,
            'name'  => $c->name,
            'type'  => Company::class,
            'label' => 'Société: ' . $c->name
        ]);

        return Inertia::render('invoices', [
            'invoices'    => $invoices,
            'billables'   => $customers->concat($companies),
            'officeRooms' => OfficeRoom::all(['id', 'name', 'city']),
        ]);
    }

    /**
     * Store a new invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'           => 'required|date',
            'type'           => 'required|in:sale,purchase',
            'billable_id'    => 'required|integer',
            'billable_type'  => 'required|string|in:App\Models\Customer,App\Models\Company',
            'office_room_id' => 'nullable|exists:office_rooms,id',
        ]);

        // استعملنا whereDate باش نتفاداو مشكل الوقت 00:00:00
        $session = DailySession::whereDate('session_date', $validated['date'])->first();

        if (!$session) {
            return back()->withErrors([
                'date' => "Aucune session n'est ouverte pour cette date. Veuillez créer une session d'abord."
            ]);
        }

        if ($session->status === 'closed') {
            return back()->withErrors([
                'date' => "La session pour cette date est déjà clôturée."
            ]);
        }

        $invoice = Invoice::create([
            'date'           => $validated['date'],
            'type'           => $validated['type'],
            'billable_id'    => $validated['billable_id'],
            'billable_type'  => $validated['billable_type'],
            'session_id'     => $session->id,
            'office_room_id' => $validated['office_room_id'],
            'created_by'     => $request->user()->id,
            'status'         => 'pending',
            'amount'         => 0,
            'tva'            => 0,
            'boxes'          => 0,
            'weight'         => 0,
        ]);

        return redirect()->route('invoices.show', $invoice->id)
            ->with('success', 'Facture initialisée avec succès.');
    }

    /**
     * Show invoice details
     */
    public function show(Invoice $invoice)
    {
        $invoice->load(['billable', 'officeRoom', 'items.item', 'items.boat', 'items.differences.customer']);

        return Inertia::render('show', [
            'invoice' => $invoice,
            'boats'   => Boat::all(['id', 'name']),
            'items'   => Item::all(['id', 'name']),
            'customers' => Customer::all(['id', 'name']),
        ]);
    }

    /**
     * Update invoice and handle session validation
     */
    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'date'           => 'required|date',
            'billable_id'    => 'required|integer',
            'billable_type'  => 'required|string|in:App\Models\Customer,App\Models\Company',
            'office_room_id' => 'nullable|exists:office_rooms,id',
            'status'         => 'required|string',
        ]);

        if ($invoice->date !== $validated['date']) {
            // نفس الشيء هنا: whereDate
            $session = DailySession::whereDate('session_date', $validated['date'])->first();

            if (!$session) {
                return back()->withErrors([
                    'date' => "Impossible de changer la date : Aucune session n'existe pour ce jour."
                ]);
            }

            if ($session->status === 'closed') {
                return back()->withErrors([
                    'date' => "Impossible de changer la date : La session de ce jour est déjà clôturée."
                ]);
            }

            $invoice->session_id = $session->id;
        }

        $invoice->update($validated);

        return back()->with('success', 'Facture mise à jour avec succès.');
    }

    /**
     * Archive (Soft Delete)
     */
    public function destroy(Invoice $invoice)
    {
        if ($invoice->amount > 0) {
            return back()->with(
                'error',
                "Action interdite : La facture #{$invoice->invoice_number} contient des montants financiers."
            );
        }

        try {
            $invoice->items()->delete();
            $invoice->delete();

            return back()->with('success', "La facture a été archivée avec succès.");
        } catch (\Exception $e) {
            return back()->with('error', "Une erreur est survenue lors de l'archivage.");
        }
    }
}
