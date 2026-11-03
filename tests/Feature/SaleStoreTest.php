<?php

use App\Models\Category;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\Usine;
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
            'owner_id' => $customer->id,
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
            'owner_id' => $customer->id,
            'session_id' => $session->id,
            'type' => 'normal',
        ])
        ->assertRedirect(route('sales.show', Sale::query()->firstOrFail()));
});

test('usine sales are assigned to an usine owner', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $usine = Usine::create(['name' => 'Usine Vente']);

    $this->actingAs(User::factory()->create())
        ->post(route('sales.store'), [
            'date' => '2026-06-01',
            'owner_id' => $usine->id,
            'session_id' => $session->id,
            'type' => 'usine',
        ])
        ->assertRedirect(route('sales.show', Sale::query()->firstOrFail()));

    $sale = Sale::query()->firstOrFail();

    expect($sale->owner_id)->toBe($usine->id)
        ->and($sale->owner_type)->toBe(Usine::class)
        ->and($sale->owner->is($usine))->toBeTrue();
});

test('a sale owner can be changed between customers and usines after items are distributed', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $customer = Customer::create(['name' => 'Client Vente']);
    $otherCustomer = Customer::create(['name' => 'Autre Client']);
    $usine = Usine::create(['name' => 'Usine Mise à jour']);
    $otherUsine = Usine::create(['name' => 'Autre Usine']);
    $item = Item::create([
        'name' => 'Article Vente',
        'category_id' => Category::create(['name' => 'Catégorie Vente'])->id,
    ]);
    $sale = Sale::create([
        'date' => '2026-06-01',
        'owner_id' => $customer->id,
        'owner_type' => Customer::class,
        'session_id' => $session->id,
        'type' => 'normal',
    ]);
    $saleItem = SaleItem::create([
        'sale_id' => $sale->id,
        'item_id' => $item->id,
        'unit_count' => 3,
        'sale_price' => 25,
        'real_price' => 20,
        'is_with_tax' => false,
    ]);
    $originalSaleItem = $saleItem->fresh()->getAttributes();

    $user = User::factory()->create();

    foreach ([
        [$otherCustomer->id, 'normal', Customer::class],
        [$usine->id, 'usine', Usine::class],
        [$otherUsine->id, 'usine', Usine::class],
        [$customer->id, 'normal', Customer::class],
    ] as [$ownerId, $type, $ownerType]) {
        $this->actingAs($user)
            ->patch(route('sales.update', $sale), [
                'date' => '2026-06-01',
                'owner_id' => $ownerId,
                'type' => $type,
            ])
            ->assertSessionHasNoErrors();

        $sale->refresh();

        expect($sale->owner_id)->toBe($ownerId)
            ->and($sale->owner_type)->toBe($ownerType)
            ->and($sale->items()->first()->getAttributes())->toBe($originalSaleItem);
    }
});
