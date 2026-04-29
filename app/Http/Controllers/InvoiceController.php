<?php

namespace App\Http\Controllers;

use App\Models\Boat;
use App\Models\Caution;
use App\Models\Company;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\OfficeRoom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /**
     * Afficher la liste des factures
     */
    public function index()
    {
        $invoices = Invoice::with(['billable', 'officeRoom', 'session', 'caution'])
            ->latest()
            ->paginate(10);

        $customers = Customer::select('id', 'name')->get()->map(fn($c) => [
            'id'   => $c->id,
            'name' => $c->name,
            'type' => Customer::class,
        ]);

        $companies = Company::select('id', 'name')->get()->map(fn($c) => [
            'id'   => $c->id,
            'name' => $c->name,
            'type' => Company::class,
        ]);


        return Inertia::render('invoices', [
            'invoices'    => $invoices,
            'billables'   => $customers->concat($companies),
            'officeRooms' => OfficeRoom::all(['id', 'name', 'city']),
            'sessions'    => DailySession::where('status', 'open')->latest()->get(['id', 'session_date']),
            'cautions' => Caution::select('id', 'name', 'owner_id', 'owner_type')->get(),
        ]);
    }

    /**
     * Créer une nouvelle facture
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'           => 'required|date',
            'type'           => 'required|in:sale,purchase',
            'billable_id'    => 'required|integer',
            'billable_type'  => 'required|string|in:App\Models\Customer,App\Models\Company',
            'session_id'     => 'required|exists:daily_sessions,id',
            'office_room_id' => 'required|exists:office_rooms,id',
            'caution_id'     => 'required|exists:cautions,id',
        ]);

        $session = DailySession::findOrFail($validated['session_id']);

        if ($session->status === 'closed') {
            return back()->withErrors(['session_id' => "Action impossible : La session est clôturée."]);
        }

        return DB::transaction(function () use ($validated, $request) {
            $year = now()->year;

            $lastInvoice = Invoice::withTrashed()
                ->where('invoice_number', 'like', $year . '%')
                ->selectRaw('MAX(CAST(invoice_number AS INTEGER)) as max_val')
                ->first();

            $maxNumber = $lastInvoice ? $lastInvoice->max_val : null;

            $nextNumber = $maxNumber ? ($maxNumber + 1) : ($year . '00001');

            while (Invoice::withTrashed()->where('invoice_number', $nextNumber)->exists()) {
                $nextNumber++;
            }

            $invoice = Invoice::create([
                'date'           => $validated['date'],
                'type'           => $validated['type'],
                'billable_id'    => $validated['billable_id'],
                'billable_type'  => $validated['billable_type'],
                'session_id'     => $validated['session_id'],
                'office_room_id' => $validated['office_room_id'],
                'caution_id'     => $validated['caution_id'] ?? null,
                'invoice_number' => (int)$nextNumber,
                'created_by'     => $request->user()->id,
                'status'         => 'pending',
                'amount'         => 0,
                'tva'            => 0,
                'boxes'          => 0,
                'weight'         => 0,
            ]);

            return redirect()->route('invoices.show', $invoice->id)
                ->with('success', "Facture #{$nextNumber} créée avec succès.");
        });
    }

    /**
     * Mettre à jour une facture
     */
    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'date'           => 'required|date',
            'billable_id'    => 'required|integer',
            'billable_type'  => 'required|string|in:App\Models\Customer,App\Models\Company',
            'office_room_id' => 'required|exists:office_rooms,id',
            'session_id'     => 'required|exists:daily_sessions,id',
            'caution_id'     => 'required|exists:cautions,id',
            'status'         => 'required|string',
        ]);

        $session = DailySession::findOrFail($validated['session_id']);

        if ($session->status === 'closed' && $invoice->session_id !== (int)$validated['session_id']) {
            return back()->withErrors(['session_id' => "Transfert impossible : La session cible est clôturée."]);
        }

        $invoice->update($validated);

        return back()->with('success', "Facture mise à jour avec succès.");
    }

    /**
     * Afficher les détails d'une facture
     */
    public function show(Invoice $invoice)
    {
        $invoice->load([
            'billable',
            'officeRoom',
            'caution',
            'items.item',
            'items.boat',
            'items.differences.customer',
            'session',
            'items.receiptItems' => function ($q) { {
                    $q->where('type', 'commission')
                        ->where('real_price', '>', 0)
                        ->with('receipt.customer');
                }
            }
        ]);

        return Inertia::render('invoice-show', [
            'invoice'   => $invoice,
            'boats'     => Boat::all(['id', 'name']),
            'items'     => Item::all(['id', 'name']),
            'customers' => Customer::all(['id', 'name']),
        ]);
    }

    /**
     * Archiver une facture (Soft Delete)
     */
    public function destroy(Invoice $invoice)
    {
        // Sécurité : Ne pas supprimer une facture qui contient déjà des calculs/montants
        if ($invoice->amount > 0) {
            return back()->with('error', "Suppression impossible : Cette facture contient déjà des montants.");
        }

        try {
            DB::transaction(function () use ($invoice) {
                $invoice->items()->delete();
                $invoice->delete();
            });

            return back()->with('success', "La facture a été archivée avec succès.");
        } catch (\Exception $e) {
            return back()->with('error', "Une erreur est survenue lors de l'archivage.");
        }
    }
}
