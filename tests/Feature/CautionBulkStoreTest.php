<?php

use App\Models\Caution;
use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('plusieurs cautions sont créées en une seule requête avec leurs propriétaires', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);
    $company = Company::create(['name' => 'Societe Une']);

    $this->actingAs($user)
        ->from(route('cautions'))
        ->post(route('cautions.bulkStore'), [
            'cautions' => [
                ['name' => 'Caution CIH', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
                ['name' => 'Depot Cash X', 'owner_id' => $company->id, 'owner_type' => Company::class],
            ],
        ])
        ->assertRedirect(route('cautions'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, '2 caution(x) créé(s)'));

    // Le modèle normalise toujours la saisie en minuscules.
    expect(Caution::count())->toBe(2)
        ->and(Caution::where('name', 'caution cih')->first()->owner_id)->toBe($customer->id)
        ->and(Caution::where('name', 'caution cih')->first()->owner_type)->toBe(Customer::class)
        ->and(Caution::where('name', 'depot cash x')->first()->owner_id)->toBe($company->id)
        ->and(Caution::where('name', 'depot cash x')->first()->owner_type)->toBe(Company::class);
});

test('les noms de cautions sont nettoyés, dédupliqués et les lignes vides ignorées', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);

    $this->actingAs($user)
        ->from(route('cautions'))
        ->post(route('cautions.bulkStore'), [
            'cautions' => [
                ['name' => '  Caution CIH  ', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
                ['name' => 'caution cih', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
                ['name' => '   ', 'owner_id' => '', 'owner_type' => ''],
            ],
        ])
        ->assertRedirect(route('cautions'));

    expect(Caution::count())->toBe(1)
        ->and(Caution::first()->name)->toBe('Caution cih')
        ->and(Caution::first()->owner_id)->toBe($customer->id);
});

test('une caution déjà existante est ignorée sans être dupliquée', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);
    $company = Company::create(['name' => 'Societe Une']);

    Caution::create(['name' => 'caution cih', 'owner_id' => $customer->id, 'owner_type' => Customer::class]);

    $this->actingAs($user)
        ->from(route('cautions'))
        ->post(route('cautions.bulkStore'), [
            'cautions' => [
                ['name' => 'Caution CIH', 'owner_id' => $company->id, 'owner_type' => Company::class],
                ['name' => 'Caution BMCE', 'owner_id' => $company->id, 'owner_type' => Company::class],
            ],
        ])
        ->assertRedirect(route('cautions'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'ignoré'));

    expect(Caution::count())->toBe(2)
        // La caution existante garde son propriétaire d'origine.
        ->and(Caution::where('name', 'caution cih')->first()->owner_id)->toBe($customer->id)
        ->and(Caution::where('name', 'caution bmce')->first()->owner_id)->toBe($company->id);
});

test('une caution archivée est restaurée avec son nouveau propriétaire', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);
    $company = Company::create(['name' => 'Societe Une']);

    $caution = Caution::create(['name' => 'caution cih', 'owner_id' => $customer->id, 'owner_type' => Customer::class]);
    $caution->delete();

    expect(Caution::withTrashed()->count())->toBe(1)
        ->and(Caution::count())->toBe(0);

    $this->actingAs($user)
        ->from(route('cautions'))
        ->post(route('cautions.bulkStore'), [
            'cautions' => [
                ['name' => 'Caution CIH', 'owner_id' => $company->id, 'owner_type' => Company::class],
            ],
        ])
        ->assertRedirect(route('cautions'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'restauré'));

    expect(Caution::withTrashed()->count())->toBe(1)
        ->and(Caution::count())->toBe(1)
        ->and(Caution::find($caution->id)->trashed())->toBeFalse()
        ->and(Caution::find($caution->id)->owner_id)->toBe($company->id)
        ->and(Caution::find($caution->id)->owner_type)->toBe(Company::class);
});

test('la création multiple de cautions est refusée quand la liste est vide', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('cautions'))
        ->post(route('cautions.bulkStore'), ['cautions' => []])
        ->assertSessionHasErrors('cautions');

    expect(Caution::count())->toBe(0);
});

test('la création multiple de cautions est refusée quand un propriétaire manque', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);

    $this->actingAs($user)
        ->from(route('cautions'))
        ->post(route('cautions.bulkStore'), [
            'cautions' => [
                ['name' => 'Caution CIH', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
                ['name' => 'Caution BMCE', 'owner_id' => '', 'owner_type' => ''],
            ],
        ])
        ->assertSessionHasErrors(['cautions.1.owner_id', 'cautions.1.owner_type']);

    // Aucune caution n'est créée quand la validation échoue.
    expect(Caution::count())->toBe(0);
});

test('la création multiple de cautions est refusée quand le type de propriétaire est invalide', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);

    $this->actingAs($user)
        ->from(route('cautions'))
        ->post(route('cautions.bulkStore'), [
            'cautions' => [
                ['name' => 'Caution CIH', 'owner_id' => $customer->id, 'owner_type' => User::class],
            ],
        ])
        ->assertSessionHasErrors('cautions.0.owner_type');

    expect(Caution::count())->toBe(0);
});

test('le message du toast des cautions est fourni par le backend (flash.success)', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Un']);

    // Même payload que celui envoyé par le <Form> du dialogue.
    $this->actingAs($user)
        ->from(route('cautions'))
        ->post(route('cautions.bulkStore'), [
            'cautions' => [
                ['name' => 'Caution CIH', 'owner_id' => (string) $customer->id, 'owner_type' => Customer::class],
                ['name' => 'Caution BMCE', 'owner_id' => (string) $customer->id, 'owner_type' => Customer::class],
            ],
        ])
        ->assertRedirect(route('cautions'));

    // La page rechargée transporte le flash qui alimente le toast.success.
    $this->actingAs($user)
        ->get(route('cautions'))
        ->assertInertia(fn ($page) => $page
            ->component('cautions')
            ->where('flash.success', '2 caution(x) créé(s). ✅')
        );
});

test('la création multiple de cautions reste interdite aux visiteurs', function () {
    $customer = Customer::create(['name' => 'Client Un']);

    $this->post(route('cautions.bulkStore'), [
        'cautions' => [
            ['name' => 'Caution CIH', 'owner_id' => $customer->id, 'owner_type' => Customer::class],
        ],
    ])->assertRedirect(route('login'));

    expect(Caution::count())->toBe(0);
});
