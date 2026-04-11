<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $accounts = Account::withCount(['invoices', 'boats'])->get();

        return inertia('accounts', [
            'accounts' => $accounts
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
        // dd($request->all());

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type'  => 'required|string|max:100',
            'title' => 'nullable|string|max:100',
        ]);

        // نزيدو الـ ID ديال الـ Admin اللي كونيكطي دابا
        $validated['created_by'] = $request->user()->id;

        Account::create($validated);

        return redirect()->route('accounts')->with('success', 'Account created!');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Account $account)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'type'  => 'required|string|max:100',
            'title' => 'nullable|string|max:100',
        ]);

        $account->update($validated);

        return redirect()->back()->with('success', 'Account updated successfully!');
    }

    /**
     * أرشفة حساب
     */
    public function destroy(Account $account)
    {
        // 1. تشيك واش كاينين فواتير (Invoices)
        // ملاحظة: invoices() هي العلاقة اللي خاص تكون عندك فـ Model Account
        $invoicesCount = $account->invoices()->count();

        // 2. تشيك واش كاينين مراكب (Boats)
        $boatsCount = $account->boats()->count();

        // 3. المنع إذا وجد سجل واحد على الأقل
        if ($invoicesCount > 0 || $boatsCount > 0) {
            $message = "Impossible d'archiver ce compte : ";
            $reasons = [];

            if ($boatsCount > 0) $reasons[] = "$boatsCount bateau(x)";
            if ($invoicesCount > 0) $reasons[] = "$invoicesCount facture(s)";

            return redirect()->back()->with('error', $message . implode(' et ', $reasons) . '.');
        }

        // 4. إلا كان "صافي" (خاوي)، أرشفه
        $account->delete();

        return redirect()->back()->with('success', 'Le compte "' . $account->name . '" a été archivé avec succès. ✅');
    }

    
}
