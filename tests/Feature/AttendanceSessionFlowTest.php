<?php

use App\Models\Attendance;
use App\Models\DailySession;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Worker;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Les pages Inertia rendent app.blade.php : on évite la dépendance au manifest Vite.
    $this->withoutVite();
});

/**
 * Crée une journée ouverte avec une zone, plus un utilisateur et un ouvrier
 * disponibles pour les pointages.
 */
function createAttendanceFlowContext(string $status = 'open'): array
{
    $user = User::factory()->create();
    $worker = Worker::create(['name' => 'Ouvrier Test']);
    $zone = Zone::create(['name' => 'Laayoune '.uniqid()]);

    $session = DailySession::create([
        'session_date' => now()->startOfDay(),
        'status' => $status,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $sessionZone = SessionZone::create([
        'daily_session_id' => $session->id,
        'zone_id' => $zone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    return compact('user', 'worker', 'zone', 'session', 'sessionZone');
}

test('la création depuis une journée ouvre directement la feuille de pointage', function () {
    $context = createAttendanceFlowContext();

    $this->actingAs($context['user'])
        ->post(route('attendances.store'), [
            'session_zone_id' => $context['sessionZone']->id,
            'redirect_to' => 'show',
        ])
        ->assertRedirect(route('attendances.show', [
            'attendance' => Attendance::latest('id')->value('id'),
            'from_session' => $context['session']->id,
        ]));

    expect(Attendance::count())->toBe(1);
});

test('la création depuis la liste des pointages revient sur la page précédente', function () {
    $context = createAttendanceFlowContext();

    $this->actingAs($context['user'])
        ->from(route('attendances'))
        ->post(route('attendances.store'), [
            'session_zone_id' => $context['sessionZone']->id,
        ])
        ->assertRedirect(route('attendances'));

    expect(Attendance::count())->toBe(1);
});

test('la création est refusée quand la journée est clôturée', function () {
    $context = createAttendanceFlowContext('closed');

    $this->actingAs($context['user'])
        ->post(route('attendances.store'), [
            'session_zone_id' => $context['sessionZone']->id,
        ])
        ->assertSessionHasErrors('session_zone_id');

    expect(Attendance::count())->toBe(0);
});

test('la feuille de pointage retourne vers la liste par défaut', function () {
    $context = createAttendanceFlowContext();
    $attendance = Attendance::create([
        'session_zone_id' => $context['sessionZone']->id,
        'total_wage' => 0,
    ]);

    $this->actingAs($context['user'])
        ->get(route('attendances.show', $attendance))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('attendances-show')
            ->where('backUrl', route('attendances'))
        );
});

test('la feuille de pointage retourne à la journée dont elle vient', function () {
    $context = createAttendanceFlowContext();
    $attendance = Attendance::create([
        'session_zone_id' => $context['sessionZone']->id,
        'total_wage' => 0,
    ]);

    $this->actingAs($context['user'])
        ->get(route('attendances.show', [
            'attendance' => $attendance->id,
            'from_session' => $context['session']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('attendances-show')
            ->where('backUrl', route('sessions.show', [$context['session']->id]))
            // La page lit la journée via la relation snake_case `session_zone`.
            ->where('attendance.session_zone.daily_session.status', 'open')
            ->where(
                'attendance.session_zone.daily_session.session_date',
                fn ($date) => str_starts_with((string) $date, $context['session']->session_date->toDateString()),
            )
            ->where('attendance.session_zone.zone.id', $context['zone']->id)
        );
});
