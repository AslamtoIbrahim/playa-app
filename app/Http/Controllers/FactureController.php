<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use Illuminate\Http\Request;
use App\Models\Account;

class FactureController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // كنجيبو الفاتورات مع ماليها
        // $factures = Facture::with('account')->latest()->get();
        $factures = Facture::with('account')
            ->latest()
            ->withSum('payments as total_paid', 'amount')
            ->paginate(10);

        // كنجيبو كاع الـ Accounts باش نختارو منهم فـ الـ Modal ديال "Add Facture"
        $accounts = Account::all(['id', 'name']);

        return inertia('factures', [
            'factures' => $factures,
            'accounts' => $accounts // هادي هي اللي غاتعمر لينا الـ Select
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'       => 'required|date',
            'amount'     => 'required|numeric|min:0',
            'weight'     => 'required|numeric|min:0',
            'account_id' => 'required|exists:accounts,id',
        ]);

        // نزيدو الـ user والـ status الافتراضي
        $validated['created_by'] = $request->user()->id;
        $validated['status']     = 'unpaid';

        \App\Models\Facture::create($validated);

        // رجع back باش الـ Inertia تحدد الـ Props بلا ما تخرج من الصفحة
        return back()->with('success', 'Facture created!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Facture $facture)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Facture $facture)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Facture $facture)
    {
        $validated = $request->validate([
            'date'       => 'required|date',
            'amount'     => 'required|numeric|min:0',
            'weight'     => 'nullable|numeric|min:0',
            'account_id' => 'required|exists:accounts,id',
        ]);

        $facture->update($validated);

        return back()->with('success', 'Facture updated!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Facture $facture)
    {
        $facture->delete();

        return back()->with('success', 'Facture deleted successfully!');
    }
}
