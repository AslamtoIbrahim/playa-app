<?php

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('plusieurs articles sont créés en une seule requête avec leurs catégories', function () {
    $user = User::factory()->create();
    $poisson = Category::create(['name' => 'Poisson']);
    $boissons = Category::create(['name' => 'Boissons']);

    $this->actingAs($user)
        ->from(route('items'))
        ->post(route('items.bulkStore'), [
            'items' => [
                ['name' => 'Poulpe G', 'category_id' => $poisson->id],
                ['name' => 'Sardine', 'category_id' => $boissons->id],
            ],
        ])
        ->assertRedirect(route('items'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, '2 article(s) créé(s)'));

    // Le modèle normalise toujours la saisie en minuscules.
    expect(Item::count())->toBe(2)
        ->and(Item::where('name', 'poulpe g')->first()->category_id)->toBe($poisson->id)
        ->and(Item::where('name', 'sardine')->first()->category_id)->toBe($boissons->id);
});

test('les noms sont nettoyés, dédupliqués et les lignes vides ignorées', function () {
    $user = User::factory()->create();
    $poisson = Category::create(['name' => 'Poisson']);

    $this->actingAs($user)
        ->from(route('items'))
        ->post(route('items.bulkStore'), [
            'items' => [
                ['name' => '  Poulpe G  ', 'category_id' => $poisson->id],
                ['name' => 'poulpe g', 'category_id' => $poisson->id],
                ['name' => '   ', 'category_id' => ''],
            ],
        ])
        ->assertRedirect(route('items'));

    expect(Item::count())->toBe(1)
        ->and(Item::first()->name)->toBe('Poulpe g')
        ->and(Item::first()->category_id)->toBe($poisson->id);
});

test('un article déjà existant est ignoré sans être dupliqué', function () {
    $user = User::factory()->create();
    $poisson = Category::create(['name' => 'Poisson']);
    $boissons = Category::create(['name' => 'Boissons']);

    Item::create(['name' => 'poulpe g', 'category_id' => $poisson->id]);

    $this->actingAs($user)
        ->from(route('items'))
        ->post(route('items.bulkStore'), [
            'items' => [
                ['name' => 'Poulpe G', 'category_id' => $boissons->id],
                ['name' => 'Calamar', 'category_id' => $boissons->id],
            ],
        ])
        ->assertRedirect(route('items'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'ignoré'));

    expect(Item::count())->toBe(2)
        // L'article existant garde sa catégorie d'origine.
        ->and(Item::where('name', 'poulpe g')->first()->category_id)->toBe($poisson->id)
        ->and(Item::where('name', 'calamar')->first()->category_id)->toBe($boissons->id);
});

test('un article archivé est restauré avec sa nouvelle catégorie', function () {
    $user = User::factory()->create();
    $poisson = Category::create(['name' => 'Poisson']);
    $boissons = Category::create(['name' => 'Boissons']);

    $item = Item::create(['name' => 'poulpe g', 'category_id' => $poisson->id]);
    $item->delete();

    expect(Item::withTrashed()->count())->toBe(1)
        ->and(Item::count())->toBe(0);

    $this->actingAs($user)
        ->from(route('items'))
        ->post(route('items.bulkStore'), [
            'items' => [
                ['name' => 'Poulpe G', 'category_id' => $boissons->id],
            ],
        ])
        ->assertRedirect(route('items'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'restauré'));

    expect(Item::withTrashed()->count())->toBe(1)
        ->and(Item::count())->toBe(1)
        ->and(Item::find($item->id)->trashed())->toBeFalse()
        ->and(Item::find($item->id)->category_id)->toBe($boissons->id);
});

test('la création multiple est refusée quand la liste est vide', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('items'))
        ->post(route('items.bulkStore'), ['items' => []])
        ->assertSessionHasErrors('items');

    expect(Item::count())->toBe(0);
});

test('la création multiple est refusée quand une catégorie manque ou est introuvable', function () {
    $user = User::factory()->create();
    $poisson = Category::create(['name' => 'Poisson']);

    $this->actingAs($user)
        ->from(route('items'))
        ->post(route('items.bulkStore'), [
            'items' => [
                ['name' => 'Poulpe G', 'category_id' => $poisson->id],
                ['name' => 'Calamar', 'category_id' => ''],
                ['name' => 'Sardine', 'category_id' => 9999],
            ],
        ])
        ->assertSessionHasErrors(['items.1.category_id', 'items.2.category_id']);

    // Aucun article n'est créé quand la validation échoue.
    expect(Item::count())->toBe(0);
});

test("le message du toast est fourni par le backend (flash.success)", function () {
    $user = User::factory()->create();
    $poisson = Category::create(['name' => 'Poisson']);

    // Même payload que celui envoyé par le <Form> du dialogue.
    $this->actingAs($user)
        ->from(route('items'))
        ->post(route('items.bulkStore'), [
            'items' => [
                ['name' => 'Poulpe G', 'category_id' => (string) $poisson->id],
                ['name' => 'Calamar', 'category_id' => (string) $poisson->id],
            ],
        ])
        ->assertRedirect(route('items'));

    // La page rechargée transporte le flash qui alimente le toast.success.
    $this->actingAs($user)
        ->get(route('items'))
        ->assertInertia(fn ($page) => $page
            ->component('items')
            ->where('flash.success', '2 article(s) créé(s). ✅')
        );
});

test('la création multiple reste interdite aux visiteurs', function () {
    $poisson = Category::create(['name' => 'Poisson']);

    $this->post(route('items.bulkStore'), [
        'items' => [
            ['name' => 'Poulpe G', 'category_id' => $poisson->id],
        ],
    ])->assertRedirect(route('login'));

    expect(Item::count())->toBe(0);
});
