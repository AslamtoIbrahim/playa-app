<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $accounts = \App\Models\Account::all();

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
     * Remove the specified resource from storage.
     */
    public function destroy(Account $account)
    {
        $account->delete();

        return redirect()->back()->with('success', 'Account deleted successfully!');
    }
}
