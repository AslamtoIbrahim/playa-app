<?php

use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Sale;
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
            'customer_id' => $customer->id,
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
            'customer_id' => $customer->id,
            'session_id' => $session->id,
            'type' => 'normal',
        ])
        ->assertRedirect(route('sales.show', Sale::query()->firstOrFail()));
});
