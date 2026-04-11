<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Boat;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class BoatController extends Controller
{
    /**
     * كيجيب كاع المراكب مع الحسابات ديالهم
     */
    public function index()
    {
        $boats = Boat::with('account')->latest()->get();
        $accounts = Account::all(['id', 'name']);

        return inertia('boats', [
            'boats' => $boats,
            'accounts' => $accounts
        ]);
    }

    /**
     * تسجيل مركب جديد
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'account_id' => 'required|exists:accounts,id',
        ]);

        Boat::create($validated);

        return back()->with('success', 'Bateau added');
    }

    /**
     * تحديث معلومات المركب
     */
    public function update(Request $request, Boat $boat)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'account_id' => 'required|exists:accounts,id',
        ]);

        $boat->update($validated);

        return back()->with('success', 'Bateau updated successfully!');
    }

    /**
     * أرشفة مركب (Boat)
     */
    public function destroy(Boat $boat)
    {
        // 1. تشيك واش المركب مسجل فـ أسطر الفواتير (invoice_items)
        // لازم تكون عندك علاقة invoiceItems() فـ الموديل Boat
        $invoiceItemsCount = $boat->invoiceItems()->count();

        // 2. المنع إذا كان للمركب تاريخ مالي (Transactions)
        if ($invoiceItemsCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver le bateau '{$boat->name}' : il est lié à $invoiceItemsCount transaction(s) dans les factures."
            );
        }

        // 3. الأرشفة إذا كان "نقي"
        $boat->delete();

        return redirect()->back()->with('success', "Le bateau '{$boat->name}' a été déplacé vers les archives. 🗑️");
    }

    
}
