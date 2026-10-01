<?php

use App\Models\Boat;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Receipt;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Inertia pages render app.blade.php: avoid the Vite manifest dependency.
    $this->withoutVite();
});

/**
 * Create a receipt attached to an open daily session zone, so the index page
 * exercises the exact same eager loaded relations as production.
 */
function createReceiptForIndexPage(Customer $customer): Receipt
{
    $zone = Zone::create(['name' => 'Zone '.uniqid()]);

    $session = DailySession::create([
        'session_date' => now()->toDateString(),
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

    $boat = Boat::create([
        'name' => 'Boat '.uniqid(),
        'owner_id' => $customer->id,
        'owner_type' => Customer::class,
    ]);

    return Receipt::create([
        'date' => now()->toDateString(),
        'customer_id' => $customer->id,
        'session_zone_id' => $sessionZone->id,
        'boat_id' => $boat->id,
        'quantity' => 0,
        'total_amount' => 0,
        'total_boxes' => 0,
    ]);
}

test('the receipts index page renders the paginated receipts list', function () {
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Test']);
    $receipt = createReceiptForIndexPage($customer);

    $this->actingAs($user)
        ->get(route('receipts'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('receipts')
            ->has('receipts.data', 1)
            ->where('receipts.data.0.id', $receipt->id)
            // The customer name is normalized by its accessor (lowercase + ucfirst).
            ->where('receipts.data.0.customer.name', 'Client test')
        );
});

test('the receipts index page is read only', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('receipts'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('receipts')
            ->missing('customers')
            ->missing('sessionZones')
            ->missing('boats')
        );
});
