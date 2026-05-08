<?php

namespace App\Http\Controllers;

use App\Models\SessionZone;
use App\Models\DailySession; // Import DailySession
use App\Models\Zone; // Import Zone
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // Import DB for transactions

class SessionZoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Fetch session zones with their related daily sessions and zones, then paginate.
        $sessionZones = SessionZone::with(['dailySession', 'zone'])
            ->latest()
            ->paginate(10);

        // You would then pass this data to your Inertia view.
        // return Inertia::render('session-zones/index', ['sessionZones' => $sessionZones]);
        // For now, leaving it empty as per the original structure.
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Fetch data needed for the form (e.g., open daily sessions and all zones).
        $dailySessions = DailySession::where('status', 'open')->get(['id', 'session_date']);
        $zones = Zone::all(['id', 'name']); // Assuming 'name' column exists in zones table

        // Return the Inertia view for the create form.
        // return Inertia::render('session-zones/create', [
        //     'dailySessions' => $dailySessions,
        //     'zones' => $zones
        // ]);
        // For now, leaving it empty as per the original structure.
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'daily_session_id' => 'required|exists:daily_sessions,id',
            'zone_id' => 'required|exists:zones,id',
            'total_buy' => 'required|numeric|min:0',
            'total_sell' => 'required|numeric|min:0',
        ]);

        // Check if the related daily session is closed
        $dailySession = DailySession::findOrFail($validated['daily_session_id']);
        if ($dailySession->status === 'closed') {
            return back()->withErrors(['daily_session_id' => 'Cannot create SessionZone for a closed daily session.']);
        }

        // Check if a session zone already exists for this daily session and zone to enforce the unique constraint
        $existingSessionZone = SessionZone::where('daily_session_id', $validated['daily_session_id'])
            ->where('zone_id', $validated['zone_id'])
            ->first();
        if ($existingSessionZone) {
            return back()->withErrors(['zone_id' => 'A session zone for this zone already exists for the selected daily session.']);
        }

        try {
            DB::transaction(function () use ($validated) {
                SessionZone::create([
                    'daily_session_id' => $validated['daily_session_id'],
                    'zone_id' => $validated['zone_id'],
                    'total_buy' => $validated['total_buy'],
                    'total_sell' => $validated['total_sell'],
                ]);
            });
            // Redirect to index or show, and provide a success message
            // return redirect()->route('session-zones.index')->with('success', 'SessionZone created successfully!');
            return back()->with('success', 'SessionZone created successfully!'); // Or redirect back
        } catch (\Exception $e) {
            // Log the error for debugging: \Log::error($e->getMessage());
            return back()->with('error', 'An error occurred while creating the SessionZone.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(SessionZone $sessionZone)
    {
        // Load relationships if needed for display
        $sessionZone->load(['dailySession', 'zone']);
        // return Inertia::render('session-zones/show', ['sessionZone' => $sessionZone]);
        // For now, leaving it empty as per the original structure.
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SessionZone $sessionZone)
    {
        // Load relationships needed for the edit form
        $sessionZone->load(['dailySession', 'zone']);
        $dailySessions = DailySession::where('status', 'open')->get(['id', 'session_date']); // Or fetch all if needed
        $zones = Zone::all(['id', 'name']);

        // return Inertia::render('session-zones/edit', [
        //     'sessionZone' => $sessionZone,
        //     'dailySessions' => $dailySessions,
        //     'zones' => $zones
        // ]);
        // For now, leaving it empty as per the original structure.
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SessionZone $sessionZone)
    {
        $validated = $request->validate([
            'total_buy' => 'required|numeric|min:0',
            'total_sell' => 'required|numeric|min:0',
            // You might not want to allow changing daily_session_id or zone_id via update
            // If you do, ensure validation and checks are in place.
        ]);

        // Check if the related daily session is closed
        $dailySession = DailySession::findOrFail($sessionZone->daily_session_id);
        if ($dailySession->status === 'closed') {
            return back()->withErrors(['daily_session_id' => 'Cannot update SessionZone linked to a closed daily session.']);
        }

        try {
            $sessionZone->update([
                'total_buy' => $validated['total_buy'],
                'total_sell' => $validated['total_sell'],
            ]);
            // return redirect()->route('session-zones.index')->with('success', 'SessionZone updated successfully!');
            return back()->with('success', 'SessionZone updated successfully!'); // Or redirect back
        } catch (\Exception $e) {
            // Log the error for debugging: \Log::error($e->getMessage());
            return back()->with('error', 'An error occurred while updating the SessionZone.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SessionZone $sessionZone)
    {
        // Check if the related daily session is closed
        $dailySession = DailySession::findOrFail($sessionZone->daily_session_id);
        if ($dailySession->status === 'closed') {
            return back()->withErrors(['daily_session_id' => 'Cannot delete SessionZone linked to a closed daily session.']);
        }

        // Optional: Add checks here if SessionZone has related data (like attendances, invoices, etc.) that should prevent deletion.
        // For example, check if related attendances exist before deleting:
        // if ($sessionZone->attendances()->exists()) {
        //     return back()->withErrors(['session_zone_id' => 'Cannot delete SessionZone because it has associated attendances.']);
        // }

        try {
            // DB::transaction is good practice for multiple operations, but delete is often atomic.
            $sessionZone->delete();
            // return redirect()->route('session-zones.index')->with('success', 'SessionZone deleted successfully!');
            return back()->with('success', 'SessionZone deleted successfully!'); // Or redirect back
        } catch (\Exception $e) {
            // Log the error for debugging: \Log::error($e->getMessage());
            return back()->with('error', 'An error occurred while deleting the SessionZone.');
        }
    }
}
