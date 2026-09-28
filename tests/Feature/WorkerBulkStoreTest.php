<?php

use App\Models\User;
use App\Models\Worker;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('plusieurs ouvriers sont créés en une seule requête', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('workers'))
        ->post(route('workers.bulkStore'), [
            'names' => ['Mohammed Alami', 'Karim Idrissi', 'Hassan Benali'],
        ])
        ->assertRedirect(route('workers'));

    expect(Worker::count())->toBe(3)
        ->and(Worker::where('name', 'mohammed alami')->exists())->toBeTrue()
        ->and(Worker::where('name', 'karim idrissi')->exists())->toBeTrue()
        ->and(Worker::where('name', 'hassan benali')->exists())->toBeTrue();
});

test('les noms sont nettoyés et dédupliqués dans la même requête', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('workers'))
        ->post(route('workers.bulkStore'), [
            'names' => ['  Mohammed Alami  ', 'mohammed alami', '', '   '],
        ])
        ->assertRedirect(route('workers'));

    expect(Worker::count())->toBe(1)
        ->and(Worker::first()->name)->toBe('mohammed alami');
});

test('un ouvrier déjà existant est ignoré sans être dupliqué', function () {
    $user = User::factory()->create();

    Worker::create(['name' => 'ouvrier existant']);

    $this->actingAs($user)
        ->from(route('workers'))
        ->post(route('workers.bulkStore'), [
            'names' => ['Ouvrier Existant', 'Nouvel Ouvrier'],
        ])
        ->assertRedirect(route('workers'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'ignoré'));

    expect(Worker::count())->toBe(2)
        ->and(Worker::where('name', 'nouvel ouvrier')->exists())->toBeTrue();
});

test('un ouvrier archivé est restauré au lieu d\'être dupliqué', function () {
    $user = User::factory()->create();

    $worker = Worker::create(['name' => 'ancien ouvrier']);
    $worker->delete();

    expect(Worker::withTrashed()->count())->toBe(1)
        ->and(Worker::count())->toBe(0);

    $this->actingAs($user)
        ->from(route('workers'))
        ->post(route('workers.bulkStore'), [
            'names' => ['Ancien Ouvrier'],
        ])
        ->assertRedirect(route('workers'))
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'restauré'));

    expect(Worker::withTrashed()->count())->toBe(1)
        ->and(Worker::count())->toBe(1)
        ->and(Worker::find($worker->id)->trashed())->toBeFalse();
});

test('la création multiple est refusée quand aucun nom n\'est fourni', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('workers'))
        ->post(route('workers.bulkStore'), ['names' => []])
        ->assertSessionHasErrors('names');

    expect(Worker::count())->toBe(0);
});

test('la création multiple reste interdite aux visiteurs', function () {
    $this->post(route('workers.bulkStore'), ['names' => ['Ouvrier Test']])
        ->assertRedirect(route('login'));

    expect(Worker::count())->toBe(0);
});
