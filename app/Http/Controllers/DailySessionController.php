<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DailySession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailySessionController extends Controller
{
    public function index()
    {
        $sessions = DailySession::latest('session_date')->get();

        return Inertia::render('sessions', [
            'sessions' => $sessions
        ]);
    }

    public function store(Request $request)
    {
        // 1. كنصفيو التاريخ مزيان قبل ما نبداو
        $formattedDate = \Carbon\Carbon::parse($request->session_date)->startOfDay()->toDateTimeString();

        // 2. كنبدلو القيمة ف الـ request باش الـ Validation يخدم على هاد الفورما
        $request->merge(['session_date' => $formattedDate]);

        $request->validate([
            'session_date' => [
                'required',
                'date',
                // 3. كنأكدو على لارافيل يقلب على التاريخ بالضبط كيف غا يتسجل
                \Illuminate\Validation\Rule::unique('daily_sessions', 'session_date')
            ],
        ], [
            'session_date.unique' => 'Une session existe déjà pour cette date.',
        ]);

        DailySession::create([
            'session_date' => $formattedDate,
            'status' => 'open',
            'total_buy' => 0,
            'total_sell' => 0,
        ]);

        return redirect()->back()->with('success', 'Session ouverte avec succès ! 🚀');
    }

    public function update(Request $request, DailySession $session)
    {
        // هنا كنخليو الـ Unique ولكن كانديرو ignore لـ ID ديال السيسيون الحالية
        $validated = $request->validate([
            'session_date' => 'required|date|unique:daily_sessions,session_date,' . $session->id,
        ], [
            'session_date.unique' => 'Impossible : une autre session occupe déjà cette date.',
        ]);

        $session->update($validated);

        return redirect()->back()->with('success', 'Date de la session mise à jour ! ✅');
    }

    /**
     * سد الحصة (Closing the day)
     */
    public function close(DailySession $session)
    {
        // حساب الطوطال (علاقات افتراضية، تأكد من وجودها في الموديل)
        // إذا لم تكن العلاقات موجودة بعد، يمكنك تركها 0 مؤقتاً
        $totalBuy = $session->purchases()->sum('amount') ?? 0;
        $totalSell = $session->sales()->sum('amount') ?? 0;

        $session->update([
            'status' => 'closed',
            'total_buy' => $totalBuy,
            'total_sell' => $totalSell,
            'closed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Session clôturée avec succès ! 🔒');
    }

    public function destroy(DailySession $session)
    {
        // 1. لا يمكن حذف حصة مغلقة
        if ($session->status === 'closed') {
            return redirect()->back()->with('error', 'Impossible de supprimer une session clôturée. 🔒');
        }

        // 2. لا يمكن حذف حصة فيها عمليات مالية (حتى لو كانت مفتوحة)
        // هنا كنتأكدو باللي الطوطال ديال البيع والشراء كايساوي 0
        if ($session->total_buy > 0 || $session->total_sell > 0) {
            return redirect()->back()->with('error', 'Impossible de supprimer : cette session contient déjà des opérations. ⚠️');
        }

        // إلا دازو هاد الشروط، عاد كنمسحو
        $session->delete();

        return redirect()->back()->with('success', 'Session supprimée avec succès ! 🗑️');
    }
}
