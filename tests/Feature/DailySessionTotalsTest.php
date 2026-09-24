<?php

use App\Models\Attendance;
use App\Models\AttendanceItem;
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
 * Crée une journée ouverte avec une zone : contexte minimal des tests de totaux.
 */
function createSessionTotalsContext(string $zoneName): array
{
    $zone = Zone::create(['name' => $zoneName]);

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

    return compact('zone', 'session', 'sessionZone');
}

/**
 * Ajoute une feuille de pointage (masse salariale) sur une zone de la journée.
 */
function createAttendanceWithWage(SessionZone $sessionZone, float $wage): Attendance
{
    $worker = Worker::create(['name' => 'Ouvrier '.uniqid()]);

    $attendance = Attendance::create([
        'session_zone_id' => $sessionZone->id,
        'total_wage' => $wage,
    ]);

    AttendanceItem::create([
        'attendance_id' => $attendance->id,
        'worker_id' => $worker->id,
        'wage' => $wage,
    ]);

    return $attendance;
}

test('la masse salariale des ouvriers est incluse dans le total d\'achat', function () {
    $context = createSessionTotalsContext('Totaux Ouvriers');
    createAttendanceWithWage($context['sessionZone'], 600);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sessions.show', $context['session']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sessions-show')
            ->has('attendances', 1)
            // Part ouvriers détaillée dans le payload, pour vérifier le montant affiché.
            ->where('totals.attendance', fn ($total) => (float) $total === 600.0)
            ->where('totals.buy', fn ($total) => (float) $total === 600.0)
            ->where('purchaseData.total', fn ($total) => (float) $total === 600.0)
            ->where('totals.sell', 0)
            // Les ouvriers sont une charge : la marge brute en tient compte.
            ->where('totals.margin', fn ($total) => (float) $total === -600.0)
        );

    // La liste des journées expose exactement le même total.
    $this->actingAs($user)
        ->get(route('sessions'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sessions')
            ->where('sessions.0.total_buy', fn ($total) => (float) $total === 600.0)
            ->where('sessions.0.total_sell', 0)
        );
});

test('la masse salariale de plusieurs zones s\'additionne', function () {
    $context = createSessionTotalsContext('Totaux Multi Zones');

    $secondZone = Zone::create(['name' => 'Totaux Zone Secondaire']);

    $secondSessionZone = SessionZone::create([
        'daily_session_id' => $context['session']->id,
        'zone_id' => $secondZone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    createAttendanceWithWage($context['sessionZone'], 600);
    createAttendanceWithWage($secondSessionZone, 250);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sessions.show', $context['session']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('totals.attendance', fn ($total) => (float) $total === 850.0)
            ->where('totals.buy', fn ($total) => (float) $total === 850.0)
        );
});

test('un pointage supprimé n\'est plus compté dans les totaux', function () {
    $context = createSessionTotalsContext('Totaux Pointage Supprime');
    $attendance = createAttendanceWithWage($context['sessionZone'], 600);
    $attendance->delete();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sessions.show', $context['session']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('attendances', 0)
            ->where('totals.attendance', 0)
            ->where('totals.buy', 0)
        );
});

test('la clôture fige le total d\'achat en incluant les ouvriers', function () {
    $context = createSessionTotalsContext('Totaux Cloture');
    createAttendanceWithWage($context['sessionZone'], 600);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('sessions'))
        ->patch(route('sessions.close', $context['session']))
        ->assertRedirect(route('sessions'));

    $session = $context['session']->fresh();

    expect($session->status)->toBe('closed')
        // Les montants figés correspondent à ce qui était affiché sur la fiche.
        ->and((float) $session->total_buy)->toBe(600.0)
        // Aucune vente : la clôture ne doit pas y verser les montants d'achat.
        ->and((float) $session->total_sell)->toBe(0.0)
        ->and($session->closed_at)->not->toBeNull();
});
