<?php

use App\Models\Boat;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Item;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

test('the differences index exposes the group id', function () {
    $this->withoutVite();

    $user = User::factory()->create();
    $client = Customer::create(['name' => 'Client Temp']);

    $boat = Boat::create([
        'name' => 'Bateau Temp',
        'owner_id' => $client->id,
        'owner_type' => Customer::class,
    ]);

    $category = Category::create(['name' => 'Poisson Temp']);
    $item = Item::create(['name' => 'Sardine Temp', 'category_id' => $category->id]);

    $zone = Zone::create(['name' => 'Agadir Temp']);
    $session = DailySession::create([
        'session_date' => '2026-06-01',
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

    $invoice = Invoice::create([
        'date' => '2026-06-01',
        'invoice_number' => (int) (date('Y').sprintf('%05d', 1)),
        'type' => 'purchase',
        'billable_id' => $client->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $sessionZone->id,
        'created_by' => $user->id,
    ]);

    $invoiceItem = InvoiceItem::create([
        'invoice_id' => $invoice->id,
        'item_id' => $item->id,
        'boat_id' => $boat->id,
        'unit' => 'kg',
        'unit_count' => 100,
        'unit_price' => 20,
        'amount' => 2000,
        'position' => 0,
    ]);

    $difference = Difference::create([
        'invoice_item_id' => $invoiceItem->id,
        'customer_id' => $client->id,
        'item_id' => $item->id,
        'unit_count' => 100,
        'real_price' => 25,
        'amount' => 2500,
        'total_diff' => 500,
        'boxes' => 0,
        'position' => 0,
    ]);

    $this->actingAs($user)
        ->get(route('differences'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences')
            ->has('reports.data', 1)
            ->where('reports.data.0.id', $difference->id)
        );
});
