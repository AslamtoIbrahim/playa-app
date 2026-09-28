<?php

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('plusieurs clients sont créés en une seule requête', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('customers'))
        ->post(route('customers.bulkStore'), [
            'names' => ['Ahmed Mansouri', 'Sara Alami', 'Youssef Idrissi'],
        ])
        ->assertRedirect(route('customers'));

    // Le modèle normalise toujours la saisie en minuscules.
    expect(Customer::count())->toBe(3)
        ->and(Customer::where('name', 'ahmed mansouri')->exists())->toBeTrue()
        ->and(Customer::where('name', 'sara alami')->exists())->toBeTrue()
        ->and(Customer::where('name', 'youssef idrissi')->exists())->toBeTrue();
});

test('les noms sont nettoyés et dédupliqués dans la même requête', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('customers'))
        ->post(route('customers.bulkStore'), [
            'names' => ['  AHMED Mansouri  ', 'ahmed mansouri', '', '   '],
        ])
        ->assertRedirect(route('customers'));

    expect(Customer::count())->toBe(1)
        ->and(Customer::first()->name)->toBe('Ahmed mansouri');
});

test('un client déjà existant est ignoré sans être dupliqué', function () {
    $user = User::factory()->create();

    Customer::create(['name' => 'client existant']);

    $this->actingAs($user)
        ->from(route('customers'))
        ->post(route('customers.bulkStore'), [
            'names' => ['Client Existant', 'Nouveau Client'],
        ])
        ->assertRedirect(route('customers'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'ignoré'));

    expect(Customer::count())->toBe(2)
        ->and(Customer::where('name', 'nouveau client')->exists())->toBeTrue();
});

test('un client archivé est restauré au lieu d\'être dupliqué', function () {
    $user = User::factory()->create();

    $customer = Customer::create(['name' => 'ancien client']);
    $customer->delete();

    expect(Customer::withTrashed()->count())->toBe(1)
        ->and(Customer::count())->toBe(0);

    $this->actingAs($user)
        ->from(route('customers'))
        ->post(route('customers.bulkStore'), [
            'names' => ['Ancien Client'],
        ])
        ->assertRedirect(route('customers'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'restauré'));

    expect(Customer::withTrashed()->count())->toBe(1)
        ->and(Customer::count())->toBe(1)
        ->and(Customer::find($customer->id)->trashed())->toBeFalse();
});

test('la création multiple est refusée quand aucun nom n\'est fourni', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('customers'))
        ->post(route('customers.bulkStore'), ['names' => []])
        ->assertSessionHasErrors('names');

    expect(Customer::count())->toBe(0);
});

test('la création multiple reste interdite aux visiteurs', function () {
    $this->post(route('customers.bulkStore'), ['names' => ['Client Test']])
        ->assertRedirect(route('login'));

    expect(Customer::count())->toBe(0);
});
