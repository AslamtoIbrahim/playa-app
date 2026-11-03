<?php

use App\Models\User;
use App\Models\Usine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

test('authenticated users can create, update, and delete an usine', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('usines'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('usine')
            ->has('usines', 0));

    $this->actingAs($user)
        ->from(route('usines'))
        ->post(route('usines.store'), ['name' => 'Usine Centrale'])
        ->assertRedirect(route('usines'));

    $usine = Usine::firstOrFail();

    expect($usine->name)->toBe('Usine Centrale');

    $this->actingAs($user)
        ->from(route('usines'))
        ->patch(route('usines.update', $usine), ['name' => 'Usine Nord'])
        ->assertRedirect(route('usines'));

    expect($usine->fresh()->name)->toBe('Usine Nord');

    $this->actingAs($user)
        ->from(route('usines'))
        ->delete(route('usines.destroy', $usine))
        ->assertRedirect(route('usines'));

    expect(Usine::count())->toBe(0);
});

test('usine names are required when creating or updating', function () {
    $user = User::factory()->create();
    $usine = Usine::create(['name' => 'Usine Centrale']);

    $this->actingAs($user)
        ->from(route('usines'))
        ->post(route('usines.store'), ['name' => ''])
        ->assertSessionHasErrors('name');

    $this->actingAs($user)
        ->from(route('usines'))
        ->patch(route('usines.update', $usine), ['name' => ''])
        ->assertSessionHasErrors('name');

    expect(Usine::count())->toBe(1)
        ->and($usine->fresh()->name)->toBe('Usine Centrale');
});

test('visitors cannot create an usine', function () {
    $this->post(route('usines.store'), ['name' => 'Usine Centrale'])
        ->assertRedirect(route('login'));

    expect(Usine::count())->toBe(0);
});
