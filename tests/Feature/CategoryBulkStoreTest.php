<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('plusieurs catégories sont créées en une seule requête', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('categories'))
        ->post(route('categories.bulkStore'), [
            'names' => ['Poisson', 'Boissons', 'Services'],
        ])
        ->assertRedirect(route('categories'));

    // Le modèle normalise toujours la saisie en minuscules.
    expect(Category::count())->toBe(3)
        ->and(Category::where('name', 'poisson')->exists())->toBeTrue()
        ->and(Category::where('name', 'boissons')->exists())->toBeTrue()
        ->and(Category::where('name', 'services')->exists())->toBeTrue();
});

test('les noms sont nettoyés et dédupliqués dans la même requête', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('categories'))
        ->post(route('categories.bulkStore'), [
            'names' => ['  Poisson  ', 'poisson', '', '   '],
        ])
        ->assertRedirect(route('categories'));

    expect(Category::count())->toBe(1)
        ->and(Category::first()->name)->toBe('Poisson');
});

test('une catégorie déjà existante est ignorée sans être dupliquée', function () {
    $user = User::factory()->create();

    Category::create(['name' => 'catégorie existante']);

    $this->actingAs($user)
        ->from(route('categories'))
        ->post(route('categories.bulkStore'), [
            'names' => ['Catégorie Existante', 'Nouvelle Catégorie'],
        ])
        ->assertRedirect(route('categories'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'ignoré'));

    expect(Category::count())->toBe(2)
        ->and(Category::where('name', 'nouvelle catégorie')->exists())->toBeTrue();
});

test('une catégorie archivée est restaurée au lieu d\'être dupliquée', function () {
    $user = User::factory()->create();

    $category = Category::create(['name' => 'ancienne catégorie']);
    $category->delete();

    expect(Category::withTrashed()->count())->toBe(1)
        ->and(Category::count())->toBe(0);

    $this->actingAs($user)
        ->from(route('categories'))
        ->post(route('categories.bulkStore'), [
            'names' => ['Ancienne Catégorie'],
        ])
        ->assertRedirect(route('categories'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'restauré'));

    expect(Category::withTrashed()->count())->toBe(1)
        ->and(Category::count())->toBe(1)
        ->and(Category::find($category->id)->trashed())->toBeFalse();
});

test('la création multiple est refusée quand aucun nom n\'est fourni', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('categories'))
        ->post(route('categories.bulkStore'), ['names' => []])
        ->assertSessionHasErrors('names');

    expect(Category::count())->toBe(0);
});

test('la création multiple reste interdite aux visiteurs', function () {
    $this->post(route('categories.bulkStore'), ['names' => ['Catégorie Test']])
        ->assertRedirect(route('login'));

    expect(Category::count())->toBe(0);
});
