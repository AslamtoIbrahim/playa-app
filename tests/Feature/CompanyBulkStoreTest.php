<?php

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('plusieurs sociétés sont créées en une seule requête', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('companies'))
        ->post(route('companies.bulkStore'), [
            'names' => ['Poulpe Sarl', 'Atlas Peche', 'Ocean Export'],
        ])
        ->assertRedirect(route('companies'));

    // Le modèle normalise toujours la saisie en minuscules.
    expect(Company::count())->toBe(3)
        ->and(Company::where('name', 'poulpe sarl')->exists())->toBeTrue()
        ->and(Company::where('name', 'atlas peche')->exists())->toBeTrue()
        ->and(Company::where('name', 'ocean export')->exists())->toBeTrue();
});

test('les noms sont nettoyés et dédupliqués dans la même requête', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('companies'))
        ->post(route('companies.bulkStore'), [
            'names' => ['  POULPE Sarl  ', 'poulpe sarl', '', '   '],
        ])
        ->assertRedirect(route('companies'));

    expect(Company::count())->toBe(1)
        ->and(Company::first()->name)->toBe('Poulpe sarl');
});

test('une société déjà existante est ignorée sans être dupliquée', function () {
    $user = User::factory()->create();

    Company::create(['name' => 'societe existante']);

    $this->actingAs($user)
        ->from(route('companies'))
        ->post(route('companies.bulkStore'), [
            'names' => ['Societe Existante', 'Nouvelle Societe'],
        ])
        ->assertRedirect(route('companies'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'ignoré'));

    expect(Company::count())->toBe(2)
        ->and(Company::where('name', 'nouvelle societe')->exists())->toBeTrue();
});

test('une société archivée est restaurée au lieu d\'être dupliquée', function () {
    $user = User::factory()->create();

    $company = Company::create(['name' => 'ancienne societe']);
    $company->delete();

    expect(Company::withTrashed()->count())->toBe(1)
        ->and(Company::count())->toBe(0);

    $this->actingAs($user)
        ->from(route('companies'))
        ->post(route('companies.bulkStore'), [
            'names' => ['Ancienne Societe'],
        ])
        ->assertRedirect(route('companies'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'restauré'));

    expect(Company::withTrashed()->count())->toBe(1)
        ->and(Company::count())->toBe(1)
        ->and(Company::find($company->id)->trashed())->toBeFalse();
});

test('la création multiple est refusée quand aucun nom n\'est fourni', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('companies'))
        ->post(route('companies.bulkStore'), ['names' => []])
        ->assertSessionHasErrors('names');

    expect(Company::count())->toBe(0);
});

test('la création multiple reste interdite aux visiteurs', function () {
    $this->post(route('companies.bulkStore'), ['names' => ['Societe Test']])
        ->assertRedirect(route('login'));

    expect(Company::count())->toBe(0);
});
