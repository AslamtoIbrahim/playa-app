<?php

use App\Models\Boat;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleItem;
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
 * Creates a zone of the given session, so a purchase invoice can be attached to
 * it and later distributed to a sale.
 */
function createSalesShowZone(DailySession $session, string $zoneName): SessionZone
{
    $zone = Zone::create(['name' => $zoneName]);

    return SessionZone::create([
        'daily_session_id' => $session->id,
        'zone_id' => $zone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
}

/**
 * Creates a purchase invoice holding a single line in the given session zone,
 * and returns that line so it can be distributed to a sale.
 */
function createSalesShowInvoiceItem(SessionZone $sessionZone, Customer $customer): InvoiceItem
{
    $user = User::factory()->create();

    $boat = Boat::create([
        'name' => 'Bateau '.uniqid(),
        'owner_id' => $customer->id,
        'owner_type' => Customer::class,
    ]);

    $category = Category::create(['name' => 'Poisson '.uniqid()]);
    $item = Item::create(['name' => 'Sardine '.uniqid(), 'category_id' => $category->id]);

    $date = $sessionZone->dailySession->session_date->toDateString();

    $invoice = Invoice::create([
        'date' => $date,
        'invoice_number' => (int) (date('Y', strtotime($date)).sprintf('%05d', Invoice::withTrashed()->count() + 1)),
        'type' => 'purchase',
        'billable_id' => $customer->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $sessionZone->id,
        'created_by' => $user->id,
    ]);

    return InvoiceItem::create([
        'invoice_id' => $invoice->id,
        'item_id' => $item->id,
        'boat_id' => $boat->id,
        'unit' => 'caisse',
        'unit_count' => 10,
        'unit_price' => 20,
        'weight' => 210,
        'box' => 10,
        'amount' => 200,
        'position' => 0,
    ]);
}

test('la fiche vente expose la zone et la date de journee de ses lignes', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $sessionZone = createSalesShowZone($session, 'Agadir '.uniqid());
    $customer = Customer::create(['name' => 'Client Fiche Vente']);
    $invoiceItem = createSalesShowInvoiceItem($sessionZone, $customer);

    $sale = Sale::create([
        'date' => '2026-06-01',
        'customer_id' => $customer->id,
        'session_id' => $session->id,
        'type' => 'normal',
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'invoice_item_id' => $invoiceItem->id,
        'unit_count' => 4,
        'real_price' => 25,
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sales.show', $sale))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sales-show')
            ->where('sale.id', $sale->id)
            ->has('sale.items', 1)
            // The zone is not carried by the sale: it comes from the source
            // invoice of the line and feeds the header zone badge.
            ->has('sessionZones', 1)
            ->where('sessionZones.0.id', $sessionZone->id)
            ->where('sessionZones.0.zone.name', $sessionZone->zone->name)
        );
});

test('la fiche vente deduplique les zones de ses lignes', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    // Two zones of the same session: the distribution only enforces a common
    // session, so a sale can gather lines from different zones.
    $firstZone = createSalesShowZone($session, 'Laayoune '.uniqid());
    $secondZone = createSalesShowZone($session, 'Dakhla '.uniqid());

    $customer = Customer::create(['name' => 'Client Multi Zones']);

    $sale = Sale::create([
        'date' => '2026-06-01',
        'customer_id' => $customer->id,
        'session_id' => $session->id,
        'type' => 'normal',
    ]);

    // Two lines from the first zone and one from the second: the repeated zone
    // must produce a single badge only.
    foreach ([1, 2] as $unitCount) {
        SaleItem::create([
            'sale_id' => $sale->id,
            'invoice_item_id' => createSalesShowInvoiceItem($firstZone, $customer)->id,
            'unit_count' => $unitCount,
            'real_price' => 25,
        ]);
    }

    SaleItem::create([
        'sale_id' => $sale->id,
        'invoice_item_id' => createSalesShowInvoiceItem($secondZone, $customer)->id,
        'unit_count' => 1,
        'real_price' => 30,
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sales.show', $sale))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sales-show')
            ->has('sale.items', 3)
            ->has('sessionZones', 2)
        );
});

test('la fiche vente sans ligne n expose aucune zone', function () {
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $customer = Customer::create(['name' => 'Client Vide']);

    $sale = Sale::create([
        'date' => '2026-06-01',
        'customer_id' => $customer->id,
        'session_id' => $session->id,
        'type' => 'usine',
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sales.show', $sale))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sales-show')
            ->has('sale.items', 0)
            ->has('sessionZones', 0)
        );
});
