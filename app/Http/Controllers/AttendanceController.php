<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\DailySession;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    /**
     * Liste des pointages
     */
    public function index()
    {
        // كنرتبو بـ created_at حيت التاريخ دابا كاين وسط الـ session
        $attendances = Attendance::with(['session', 'items.worker'])
            ->latest()
            ->paginate(10);

        $sessions = DailySession::orderBy('session_date', 'desc')->get();

        return Inertia::render('attendances', [
            'attendances' => $attendances,
            'sessions'    => $sessions
        ]);
    }

    /**
     * Voir les détails d'un pointage
     */
    public function show(Attendance $attendance)
    {
        $attendance->load(['session', 'items.worker']);

        $availableWorkers = Worker::orderBy('name')->get();

        return Inertia::render('attendances-show', [
            'attendance' => $attendance,
            'availableWorkers' => $availableWorkers,
        ]);
    }

    /**
     * Enregistrer un nouveau pointage
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'daily_session_id' => 'required|exists:daily_sessions,id',
            'items' => 'nullable|array', // رديتها nullable باش تقدّر تفتح ورقة خاوية
            'items.*.worker_id' => 'required_with:items|exists:workers,id',
            'items.*.wage' => 'required_with:items|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            // 1. حساب الـ total_wage (إلا ما كاينش items كيكون 0)
            $items = $validated['items'] ?? [];
            $totalWage = collect($items)->sum('wage');

            // 2. إنشاء الـ Attendance بلا Column ديال الـ date
            $attendance = Attendance::create([
                'daily_session_id' => $validated['daily_session_id'],
                'total_wage' => $totalWage,
            ]);

            // 3. إضافة الـ Items إلا تـصيفطو
            foreach ($items as $item) {
                $attendance->items()->create([
                    'worker_id' => $item['worker_id'],
                    'wage' => $item['wage'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Feuille de pointage créée ! ✅');
    }

    /**
     * Mise à jour du pointage (نفس المنطق بلا date)
     */
    public function update(Request $request, Attendance $attendance)
    {
        // 1. تعديل الـ Validation باش يقبل الـ session ويكون الـ items اختياري إلا كنتي غاتبدل غير الـ session
        $validated = $request->validate([
            'daily_session_id' => 'nullable|exists:daily_sessions,id',
            'items'            => 'nullable|array', // رديناه nullable باش ما يعكسش
            'items.*.worker_id' => 'required_with:items|exists:workers,id',
            'items.*.wage'      => 'required_with:items|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $attendance) {

            // 2. تحديث الـ session_id إلا كانت مبعوتة
            if (isset($validated['daily_session_id'])) {
                $attendance->daily_session_id = $validated['daily_session_id'];
            }

            // 3. تحديث الـ items غير إلا كانوا مبعوتين في الـ request
            if (isset($validated['items'])) {
                $attendance->items()->delete();
                $totalWage = collect($validated['items'])->sum('wage');
                $attendance->total_wage = $totalWage;

                foreach ($validated['items'] as $item) {
                    $attendance->items()->create([
                        'worker_id' => $item['worker_id'],
                        'wage' => $item['wage'],
                    ]);
                }
            }

            $attendance->save();
        });

        return redirect()->back()->with('success', 'Pointage mis à jour ! 🔄');
    }

    public function destroy(Attendance $attendance)
    {
        if ($attendance->total_wage > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible de supprimer : ce pointage contient des paiements."
            );
        }

        $attendance->delete();
        return redirect()->back()->with('success', 'Pointage supprimé. ✅');
    }
}
