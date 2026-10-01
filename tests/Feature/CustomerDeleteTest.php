<?php

use App\Models\Boat;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Les pages Inertia rendent app.blade.php : on évite la dépendance au manifest Vite.
    $this->withoutVite();
});

/**
 * Contexte minimal partagé : une journée ouverte avec sa zone, un client
 * et l'utilisateur authentifié. Sert de support aux bons, factures et ventes.
 */
function createCustomerDeleteContext(): array
{
    $user = User::factory()->create();
    $zone = Zone::create(['name' => 'Agadir '.uniqid()]);

    $session = DailySession::create([
        'session_date' => now()->startOfDay(),
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $sessionZone = SessionZone::create([
        'daily_session_id' => $session->id,
        'zone_id' => $zone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $customer = Customer::create(['name' => 'Client '.uniqid()]);

    return compact('user', 'session', 'sessionZone', 'customer');
}

test('un client sans données liées est archivé', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Libre']);

    $this->actingAs($user)
        ->from(route('customers'))
        ->delete(route('customers.destroy', $customer))
        ->assertRedirect(route('customers'))
        ->assertSessionHas('success');

    expect(Customer::where('id', $customer->id)->exists())->toBeFalse()
        ->and(Customer::withTrashed()->find($customer->id)->trashed())->toBeTrue();
});

test('l\'archivage est bloqué quand le client a un bon de réception', function () {
    $context = createCustomerDeleteContext();

    Receipt::create([
        'date' => now()->toDateString(),
        'customer_id' => $context['customer']->id,
        'session_zone_id' => $context['sessionZone']->id,
        'quantity' => 5,
        'total_amount' => 500,
        'total_boxes' => 1,
    ]);

    $this->actingAs($context['user'])
        ->from(route('customers'))
        ->delete(route('customers.destroy', $context['customer']))
        ->assertRedirect(route('customers'))
        ->assertSessionHas('error', fn (string $message) => str_contains($message, 'bon'));

    expect(Customer::where('id', $context['customer']->id)->exists())->toBeTrue();
});

test('l\'archivage est bloqué quand le client a une facture', function () {
    $context = createCustomerDeleteContext();

    Invoice::create([
        'date' => now()->toDateString(),
        'invoice_number' => 202600001,
        'type' => 'purchase',
        'billable_id' => $context['customer']->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $context['sessionZone']->id,
        'created_by' => $context['user']->id,
    ]);

    $this->actingAs($context['user'])
        ->from(route('customers'))
        ->delete(route('customers.destroy', $context['customer']))
        ->assertRedirect(route('customers'))
        ->assertSessionHas('error', fn (string $message) => str_contains($message, 'facture'));

    expect(Customer::where('id', $context['customer']->id)->exists())->toBeTrue();
});

test('l\'archivage est bloqué quand le client a une différence', function () {
    $context = createCustomerDeleteContext();

    $category = Category::create(['name' => 'Poisson '.uniqid()]);
    $item = Item::create(['name' => 'Sardine '.uniqid(), 'category_id' => $category->id]);

    Difference::create([
        'customer_id' => $context['customer']->id,
        'item_id' => $item->id,
        'unit_count' => 2,
        'real_price' => 150,
        'amount' => 300,
        'total_diff' => 100,
        'boxes' => 0,
        'position' => 0,
    ]);

    $this->actingAs($context['user'])
        ->from(route('customers'))
        ->delete(route('customers.destroy', $context['customer']))
        ->assertRedirect(route('customers'))
        ->assertSessionHas('error', fn (string $message) => str_contains($message, 'différence'));

    expect(Customer::where('id', $context['customer']->id)->exists())->toBeTrue();
});

test('l\'archivage est bloqué quand le client a une vente', function () {
    $context = createCustomerDeleteContext();

    Sale::create([
        'date' => now()->toDateString(),
        'customer_id' => $context['customer']->id,
        'session_id' => $context['session']->id,
        'created_by' => $context['user']->id,
        'type' => 'normal',
    ]);

    $this->actingAs($context['user'])
        ->from(route('customers'))
        ->delete(route('customers.destroy', $context['customer']))
        ->assertRedirect(route('customers'))
        ->assertSessionHas('error', fn (string $message) => str_contains($message, 'vente'));

    expect(Customer::where('id', $context['customer']->id)->exists())->toBeTrue();
});

test('l\'archivage est bloqué quand le client possède un bateau', function () {
    $context = createCustomerDeleteContext();

    Boat::create([
        'name' => 'Bateau '.uniqid(),
        'owner_id' => $context['customer']->id,
        'owner_type' => Customer::class,
    ]);

    $this->actingAs($context['user'])
        ->from(route('customers'))
        ->delete(route('customers.destroy', $context['customer']))
        ->assertRedirect(route('customers'))
        ->assertSessionHas('error', fn (string $message) => str_contains($message, 'bateau'));

    expect(Customer::where('id', $context['customer']->id)->exists())->toBeTrue();
});

test('l\'archivage reste interdit aux visiteurs', function () {
    $customer = Customer::create(['name' => 'Client Test']);

    $this->delete(route('customers.destroy', $customer))
        ->assertRedirect(route('login'));

    expect(Customer::where('id', $customer->id)->exists())->toBeTrue();
});
