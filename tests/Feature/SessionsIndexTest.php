<?php

use App\Models\DailySession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Inertia pages render app.blade.php: avoid the Vite manifest dependency.
    $this->withoutVite();
});

test('the sessions index page renders the sessions list', function () {
    $user = User::factory()->create();

    $session = DailySession::create([
        'session_date' => now()->startOfDay(),
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $this->actingAs($user)
        ->get(route('sessions'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sessions')
            ->has('sessions', 1)
            ->where('sessions.0.id', $session->id)
            ->where('sessions.0.status', 'open')
            ->where('sessions.0.total_buy', 0)
            ->where('sessions.0.total_sell', 0)
        );
});

test('the sessions index page is read only', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sessions'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sessions')
            ->missing('zones')
        );
});
