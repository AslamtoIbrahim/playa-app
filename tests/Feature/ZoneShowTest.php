<?php

use App\Models\Attendance;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Les pages Inertia rendent app.blade.php : on évite la dépendance au manifest Vite.
    $this->withoutVite();
});

/**
 * Ouvre une journée pour la zone donnée et retourne son SessionZone.
 *
 * Les colonnes total_buy / total_sell du pivot restent volontairement à 0 :
 * l'application ne les alimente jamais, la fiche doit donc les ignorer.
 */
function openZoneShowSessionZone(Zone $zone, string $date): SessionZone
{
    $session = DailySession::create([
        'session_date' => $date,
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    return SessionZone::create([
        'daily_session_id' => $session->id,
        'zone_id' => $zone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
}

/**
 * Crée une facture (achat ou vente) rattachée à une zone de journée.
 */
function createZoneShowInvoice(SessionZone $sessionZone, Customer $customer, string $type, float $amount, int $number): Invoice
{
    return Invoice::create([
        'date' => now()->toDateString(),
        'invoice_number' => $number,
        'type' => $type,
        'billable_id' => $customer->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $sessionZone->id,
        'amount' => $amount,
        'boxes' => 0,
        'weight' => 0,
    ]);
}

test('la fiche zone calcule les totaux depuis les opérations du SessionZone', function () {
    $zone = Zone::create(['name' => 'Zone Fiche Totaux']);
    $sessionZone = openZoneShowSessionZone($zone, now()->startOfDay()->toDateTimeString());
    $customer = Customer::create(['name' => 'Client Fiche Zone']);

    createZoneShowInvoice($sessionZone, $customer, 'purchase', 1000, 202600001);
    createZoneShowInvoice($sessionZone, $customer, 'sale', 1500, 202600002);

    // Masse salariale des ouvriers : une charge qui alimente le total d'achat.
    Attendance::create([
        'session_zone_id' => $sessionZone->id,
        'total_wage' => 600,
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('zones.show', $zone))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('zones-show')
            ->has('dailySessions', 1)
            ->where('dailySessions.0.id', $sessionZone->daily_session_id)
            ->where('dailySessions.0.status', 'open')
            // Achat = facture d'achat + masse salariale des ouvriers.
            ->where('dailySessions.0.total_buy', fn ($total) => (float) $total === 1600.0)
            ->where('dailySessions.0.total_sell', fn ($total) => (float) $total === 1500.0)
            ->has('existingSessionDates', 1)
        );
});

test('la fiche zone ne mélange pas les zones et les journées', function () {
    $zone = Zone::create(['name' => 'Zone Fiche Scoping']);
    $otherZone = Zone::create(['name' => 'Zone Fiche Autre']);

    $oldSessionZone = openZoneShowSessionZone($zone, now()->subDay()->startOfDay()->toDateTimeString());
    $sessionZone = openZoneShowSessionZone($zone, now()->startOfDay()->toDateTimeString());
    $otherSessionZone = openZoneShowSessionZone($otherZone, now()->startOfDay()->toDateTimeString());

    $customer = Customer::create(['name' => 'Client Scoping']);

    createZoneShowInvoice($oldSessionZone, $customer, 'purchase', 300, 202600010);
    createZoneShowInvoice($sessionZone, $customer, 'purchase', 1000, 202600011);
    // Opération d'une autre zone de la même journée : elle ne doit pas apparaître ici.
    createZoneShowInvoice($otherSessionZone, $customer, 'purchase', 9999, 202600012);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('zones.show', $zone))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('zones-show')
            // Une ligne par journée de la zone, la plus récente en premier.
            ->has('dailySessions', 2)
            ->where('dailySessions.0.total_buy', fn ($total) => (float) $total === 1000.0)
            ->where('dailySessions.1.total_buy', fn ($total) => (float) $total === 300.0)
            ->has('existingSessionDates', 2)
        );
});

test('la fiche zone ne mélange pas deux zones de la même journée', function () {
    $zone = Zone::create(['name' => 'Zone Fiche Multi']);
    $secondZone = Zone::create(['name' => 'Zone Fiche Multi Bis']);

    $oldSessionZone = openZoneShowSessionZone($zone, now()->subDay()->startOfDay()->toDateTimeString());
    $sessionZone = openZoneShowSessionZone($zone, now()->startOfDay()->toDateTimeString());

    // Deuxième zone de la même journée : ses ventes restent chez elle.
    $secondSessionZone = SessionZone::create([
        'daily_session_id' => $sessionZone->daily_session_id,
        'zone_id' => $secondZone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $customer = Customer::create(['name' => 'Client Multi Zones']);

    createZoneShowInvoice($sessionZone, $customer, 'sale', 700, 202600020);
    createZoneShowInvoice($secondSessionZone, $customer, 'sale', 400, 202600021);
    createZoneShowInvoice($oldSessionZone, $customer, 'sale', 50, 202600022);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('zones.show', $zone))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('zones-show')
            ->has('dailySessions', 2)
            ->where('dailySessions.0.total_sell', fn ($total) => (float) $total === 700.0)
            ->where('dailySessions.1.total_sell', fn ($total) => (float) $total === 50.0)
        );
});
