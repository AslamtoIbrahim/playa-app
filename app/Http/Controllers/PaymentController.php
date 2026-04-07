<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $payments = Payment::with(['facture.account'])
            ->latest()
            ->paginate(10);

        return inertia('payments', [
            'payments' => $payments
        ]);
    }



    /**
     * Store a newly created resource in storage.
     */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'facture_id'   => 'required|exists:factures,id',
            'amount'       => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'method'       => 'required|string|in:cash,check,transfer',
            'reference'    => 'nullable|string|max:255',
        ]);

        // نجبدو الفاتورة باش نتأكدو من الحساب
        $facture = Facture::findOrFail($validated['facture_id']);

        // (إختياري): منع الخلاص بـ مبلغ كبر ملي بقا
        // $remaining = $facture->amount - $facture->payments()->sum('amount');
        // if ($validated['amount'] > $remaining) {
        //     return back()->withErrors(['amount' => "المبلغ كبر من اللي باقي ف الفاتورة ({$remaining} DH)"]);
        // }

        $validated['created_by'] = $request->user()->id;

        DB::transaction(function () use ($validated) {
            Payment::create($validated);
        });

        return back()->with('success', 'Payment recorded successfully! 💰');
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'amount'       => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'method'       => 'required|string|in:cash,check,transfer,transfer',
            'reference'    => 'nullable|string|max:255',
        ]);

        // Laravel غايخدم الـ static::saved فـ الموديل أوتوماتيكياً
        $payment->update($validated);

        return back()->with('success', 'Payment updated successfully! ✅');
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        // الـ static::deleted فـ الموديل غايخدم أوتوماتيكياً ويرجع يحسب الـ Status
        $payment->delete();

        return back()->with('success', 'Payment deleted successfully! 🗑️');
    }
}
