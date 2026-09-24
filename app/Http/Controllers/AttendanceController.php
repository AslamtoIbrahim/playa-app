<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\SessionZone; // Add SessionZone import
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
        $attendances = Attendance::with(['sessionZone.dailySession', 'sessionZone.zone', 'items.worker']) // Changed 'session' to 'sessionZone.dailySession'
            ->latest()
            ->paginate(10);

        // $sessionZones = SessionZone::with('dailySession')
        //     ->orderBy('daily_session_id', 'desc')
        //     ->get();

        $sessionZones = SessionZone::with(['dailySession', 'zone'])
            ->whereHas('dailySession', function ($query) {
                $query->where('status', 'open');
            })
            ->latest()
            ->get(['id', 'zone_id', 'daily_session_id']);

        return Inertia::render('attendances', [
            'attendances' => $attendances,
            'sessionZones' => $sessionZones,
            // 'sessionZones'    => $sessionZones->map(function ($sessionZone) {
            //     return [
            //         'id' => $sessionZone->id,
            //         'name' => $sessionZone->dailySession->session_date->format('Y-m-d') . ' - Zone ' . $sessionZone->zone_id, // Format for display
            //     ];
            // }),
        ]);
    }

    /**
     * Voir les détails d'un pointage
     */
    public function show(Request $request, Attendance $attendance)
    {
        $attendance->load(['sessionZone.dailySession', 'sessionZone.zone', 'items.worker']); // Changed 'session' to 'sessionZone.dailySession'

        $availableWorkers = Worker::orderBy('name')->get();

        // Retour explicite : la journée d'origine quand la feuille est ouverte
        // depuis celle-ci, sinon la liste des pointages.
        $session = $attendance->sessionZone?->dailySession;
        $openedFromSession = $session !== null
            && $request->integer('from_session') === $session->id;

        $backUrl = $openedFromSession
            ? route('sessions.show', [$session->id])
            : route('attendances');

        return Inertia::render('attendances-show', [
            'attendance' => $attendance,
            'availableWorkers' => $availableWorkers,
            'backUrl' => $backUrl,
        ]);
    }

    /**
     * Enregistrer un nouveau pointage
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'session_zone_id' => 'required|exists:session_zones,id', // Changed from daily_session_id and daily_sessions
            'items' => 'nullable|array',
            'items.*.worker_id' => 'required_with:items|exists:workers,id',
            'items.*.wage' => 'required_with:items|numeric|min:0',
            'redirect_to' => 'nullable|string|in:show',
        ]);

        $sessionZone = SessionZone::with('dailySession')->findOrFail($validated['session_zone_id']);

        if ($sessionZone->dailySession?->status === 'closed') {
            return back()->withErrors([
                'session_zone_id' => 'Action impossible : la journée sélectionnée est clôturée.',
            ]);
        }

        $attendance = DB::transaction(function () use ($validated) {
            $items = $validated['items'] ?? [];
            $totalWage = collect($items)->sum('wage');

            $attendance = Attendance::create([
                'session_zone_id' => $validated['session_zone_id'], // Changed from daily_session_id
                'total_wage' => $totalWage,
            ]);

            foreach ($items as $item) {
                $attendance->items()->create([
                    'worker_id' => $item['worker_id'],
                    'wage' => $item['wage'],
                ]);
            }

            return $attendance;
        });

        // Depuis la page d'une journée, on ouvre directement la feuille créée
        // pour pouvoir pointer les ouvriers. Le paramètre `from_session` permet
        // de revenir sur la journée d'origine.
        if (($validated['redirect_to'] ?? null) === 'show') {
            return redirect()->route('attendances.show', [
                'attendance' => $attendance->id,
                'from_session' => $sessionZone->daily_session_id,
            ])->with('success', 'Feuille de pointage créée ! ✅');
        }

        return redirect()->back()->with('success', 'Feuille de pointage créée ! ✅');
    }

    /**
     * Mise à jour du pointage (نفس المنطق بلا date)
     */
    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'session_zone_id' => 'nullable|exists:session_zones,id', // Changed from daily_session_id and daily_sessions
            'items' => 'nullable|array',
            'items.*.worker_id' => 'required_with:items|exists:workers,id',
            'items.*.wage' => 'required_with:items|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $attendance) {
            if (isset($validated['session_zone_id'])) {
                $attendance->session_zone_id = $validated['session_zone_id']; // Changed from daily_session_id
            }

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
                'Impossible de supprimer : ce pointage contient des paiements.'
            );
        }

        $attendance->delete();

        return redirect()->back()->with('success', 'Pointage supprimé. ✅');
    }
}
