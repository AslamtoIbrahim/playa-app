<?php

use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Sale;
use App\Models\Usine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('sale creation from a session can return to the session page', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $customer = Customer::create(['name' => 'Client Session']);

    $this->actingAs(User::factory()->create())
        ->from(route('sessions.show', $session))
        ->post(route('sales.store'), [
            'date' => '2026-06-01',
            'owner_id' => $customer->id,
            'session_id' => $session->id,
            'type' => 'normal',
            'redirect' => 'back',
        ])
        ->assertRedirect(route('sessions.show', $session));

    expect(Sale::query()->where('session_id', $session->id)->exists())->toBeTrue();
});

test('sale creation defaults to the new sale page', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $customer = Customer::create(['name' => 'Client Vente']);

    $this->actingAs(User::factory()->create())
        ->post(route('sales.store'), [
            'date' => '2026-06-01',
            'owner_id' => $customer->id,
            'session_id' => $session->id,
            'type' => 'normal',
        ])
        ->assertRedirect(route('sales.show', Sale::query()->firstOrFail()));
});

test('usine sales are assigned to an usine owner', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $usine = Usine::create(['name' => 'Usine Vente']);

    $this->actingAs(User::factory()->create())
        ->post(route('sales.store'), [
            'date' => '2026-06-01',
            'owner_id' => $usine->id,
            'session_id' => $session->id,
            'type' => 'usine',
        ])
        ->assertRedirect(route('sales.show', Sale::query()->firstOrFail()));

    $sale = Sale::query()->firstOrFail();

    expect($sale->owner_id)->toBe($usine->id)
        ->and($sale->owner_type)->toBe(Usine::class)
        ->and($sale->owner->is($usine))->toBeTrue();
});

test('a sale owner can be changed to an usine before items are added', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $customer = Customer::create(['name' => 'Client Vente']);
    $usine = Usine::create(['name' => 'Usine Mise à jour']);
    $sale = Sale::create([
        'date' => '2026-06-01',
        'owner_id' => $customer->id,
        'owner_type' => Customer::class,
        'session_id' => $session->id,
        'type' => 'normal',
    ]);

    $this->actingAs(User::factory()->create())
        ->patch(route('sales.update', $sale), [
            'date' => '2026-06-01',
            'owner_id' => $usine->id,
            'type' => 'usine',
        ])
        ->assertSessionHasNoErrors();

    expect($sale->fresh()->owner_id)->toBe($usine->id)
        ->and($sale->fresh()->owner_type)->toBe(Usine::class);
});
