<?php

use App\Models\Attendance;
use App\Models\DailySession;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Inertia pages render app.blade.php: avoid the Vite manifest dependency.
    $this->withoutVite();
});

/**
 * Create a daily session zone and an attendance sheet attached to it, so the
 * index page exercises the same eager loaded relations as production.
 */
function createAttendanceForIndexPage(): array
{
    $zone = Zone::create(['name' => 'Zone '.uniqid()]);

    $session = DailySession::create([
        'session_date' => now()->startOfDay(),
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $sessionZone = SessionZone::create([
        'daily_session_id' => $session->id,
        'zone_id' => $zone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $attendance = Attendance::create([
        'session_zone_id' => $sessionZone->id,
        'total_wage' => 0,
    ]);

    return compact('sessionZone', 'attendance');
}

test('the attendances index page renders the paginated attendances list', function () {
    $user = User::factory()->create();
    $context = createAttendanceForIndexPage();

    $this->actingAs($user)
        ->get(route('attendances'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('attendances')
            ->has('attendances.data', 1)
            ->where('attendances.data.0.id', $context['attendance']->id)
            ->where('attendances.data.0.session_zone.id', $context['sessionZone']->id)
        );
});

test('the attendances index page is read only', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('attendances'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('attendances')
            ->missing('sessionZones')
        );
});
