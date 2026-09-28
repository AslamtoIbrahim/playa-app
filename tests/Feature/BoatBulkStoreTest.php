<?php

use App\Models\Boat;
use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('plusieurs bateaux sont créés en une seule requête avec leurs propriétaires', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);
    $company = Company::create(['name' => 'Societe Une']);

    $this->actingAs($user)
        ->from(route('boats'))
        ->post(route('boats.bulkStore'), [
            'boats' => [
                ['name' => 'Black Pearl', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
                ['name' => 'Santa Maria', 'owner_id' => $company->id, 'owner_type' => Company::class],
            ],
        ])
        ->assertRedirect(route('boats'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, '2 bateau(x) créé(s)'));

    // Le modèle normalise toujours la saisie en minuscules.
    expect(Boat::count())->toBe(2)
        ->and(Boat::where('name', 'black pearl')->first()->owner_id)->toBe($customer->id)
        ->and(Boat::where('name', 'black pearl')->first()->owner_type)->toBe(Customer::class)
        ->and(Boat::where('name', 'santa maria')->first()->owner_id)->toBe($company->id)
        ->and(Boat::where('name', 'santa maria')->first()->owner_type)->toBe(Company::class);
});

test('les noms de bateaux sont nettoyés, dédupliqués et les lignes vides ignorées', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);

    $this->actingAs($user)
        ->from(route('boats'))
        ->post(route('boats.bulkStore'), [
            'boats' => [
                ['name' => '  Black Pearl  ', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
                ['name' => 'black pearl', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
                ['name' => '   ', 'owner_id' => '', 'owner_type' => ''],
            ],
        ])
        ->assertRedirect(route('boats'));

    expect(Boat::count())->toBe(1)
        ->and(Boat::first()->name)->toBe('Black pearl')
        ->and(Boat::first()->owner_id)->toBe($customer->id);
});

test('un bateau déjà existant est ignoré sans être dupliqué', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);
    $company = Company::create(['name' => 'Societe Une']);

    Boat::create(['name' => 'black pearl', 'owner_id' => $customer->id, 'owner_type' => Customer::class]);

    $this->actingAs($user)
        ->from(route('boats'))
        ->post(route('boats.bulkStore'), [
            'boats' => [
                ['name' => 'Black Pearl', 'owner_id' => $company->id, 'owner_type' => Company::class],
                ['name' => 'Golden Ray', 'owner_id' => $company->id, 'owner_type' => Company::class],
            ],
        ])
        ->assertRedirect(route('boats'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'ignoré'));

    expect(Boat::count())->toBe(2)
        // Le bateau existant garde son propriétaire d'origine.
        ->and(Boat::where('name', 'black pearl')->first()->owner_id)->toBe($customer->id)
        ->and(Boat::where('name', 'golden ray')->first()->owner_id)->toBe($company->id);
});

test('un bateau archivé est restauré avec son nouveau propriétaire', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);
    $company = Company::create(['name' => 'Societe Une']);

    $boat = Boat::create(['name' => 'black pearl', 'owner_id' => $customer->id, 'owner_type' => Customer::class]);
    $boat->delete();

    expect(Boat::withTrashed()->count())->toBe(1)
        ->and(Boat::count())->toBe(0);

    $this->actingAs($user)
        ->from(route('boats'))
        ->post(route('boats.bulkStore'), [
            'boats' => [
                ['name' => 'Black Pearl', 'owner_id' => $company->id, 'owner_type' => Company::class],
            ],
        ])
        ->assertRedirect(route('boats'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'restauré'));

    expect(Boat::withTrashed()->count())->toBe(1)
        ->and(Boat::count())->toBe(1)
        ->and(Boat::find($boat->id)->trashed())->toBeFalse()
        ->and(Boat::find($boat->id)->owner_id)->toBe($company->id)
        ->and(Boat::find($boat->id)->owner_type)->toBe(Company::class);
});

test('la création multiple de bateaux est refusée quand la liste est vide', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('boats'))
        ->post(route('boats.bulkStore'), ['boats' => []])
        ->assertSessionHasErrors('boats');

    expect(Boat::count())->toBe(0);
});

test('la création multiple de bateaux est refusée quand un propriétaire manque', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);

    $this->actingAs($user)
        ->from(route('boats'))
        ->post(route('boats.bulkStore'), [
            'boats' => [
                ['name' => 'Black Pearl', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
                ['name' => 'Golden Ray', 'owner_id' => '', 'owner_type' => ''],
            ],
        ])
        ->assertSessionHasErrors(['boats.1.owner_id', 'boats.1.owner_type']);

    // Aucun bateau n'est créé quand la validation échoue.
    expect(Boat::count())->toBe(0);
});

test('la création multiple de bateaux est refusée quand le type de propriétaire est invalide', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);

    $this->actingAs($user)
        ->from(route('boats'))
        ->post(route('boats.bulkStore'), [
            'boats' => [
                ['name' => 'Black Pearl', 'owner_id' => $customer->id, 'owner_type' => User::class],
            ],
        ])
        ->assertSessionHasErrors('boats.0.owner_type');

    expect(Boat::count())->toBe(0);
});


test('le message du toast des bateaux est fourni par le backend (flash.success)', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);

    // Même payload que celui envoyé par le <Form> du dialogue.
    $this->actingAs($user)
        ->from(route('boats'))
        ->post(route('boats.bulkStore'), [
            'boats' => [
                ['name' => 'Black Pearl', 'owner_id' => (string) $customer->id, 'owner_type' => Customer::class],
                ['name' => 'Golden Ray', 'owner_id' => (string) $customer->id, 'owner_type' => Customer::class],
            ],
        ])
        ->assertRedirect(route('boats'));

    // La page rechargée transporte le flash qui alimente le toast.success.
    $this->actingAs($user)
        ->get(route('boats'))
        ->assertInertia(fn ($page) => $page
            ->component('boats')
            ->where('flash.success', '2 bateau(x) créé(s). ✅')
        );
});

test('la création multiple de bateaux reste interdite aux visiteurs', function () {
    $customer = Customer::create(['name' => 'Client Un']);

    $this->post(route('boats.bulkStore'), [
        'boats' => [
            ['name' => 'Black Pearl', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
        ],
    ])->assertRedirect(route('login'));

    expect(Boat::count())->toBe(0);
});

