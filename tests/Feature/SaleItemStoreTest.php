<?php

use App\Models\Boat;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Inertia pages render app.blade.php: avoid the Vite manifest dependency.
    $this->withoutVite();
});

/**
 * Full distribution context: a daily session, a purchase invoice with one
 * line, and a sale that belongs to the same session. The invoice line carries
 * 10 units at a unit price of 20.
 */
function createSaleItemContext(string $date = '2026-06-01'): array
{
    $user = User::factory()->create();
    $client = Customer::create(['name' => 'Client '.uniqid()]);
    $boat = Boat::create([
        'name' => 'Bateau '.uniqid(),
        'owner_id' => $client->id,
        'owner_type' => Customer::class,
    ]);

    $category = Category::create(['name' => 'Poisson '.uniqid()]);
    $item = Item::create(['name' => 'Sardine '.uniqid(), 'category_id' => $category->id]);

    $zone = Zone::create(['name' => 'Agadir '.uniqid()]);
    $session = DailySession::create([
        'session_date' => $date,
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
        'date' => $date,
        'invoice_number' => (int) (date('Y', strtotime($date)).sprintf('%05d', Invoice::withTrashed()->count() + 1)),
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
        'unit' => 'caisse',
        'unit_count' => 10,
        'unit_price' => 20,
        'weight' => 210,
        'box' => 10,
        'amount' => 200,
        'position' => 0,
    ]);

    $sale = Sale::create([
        'date' => $date,
        'customer_id' => $client->id,
        'session_id' => $session->id,
        'created_by' => $user->id,
    ]);

    return [
        'user' => $user,
        'client' => $client,
        'item' => $item,
        'session' => $session,
        'invoice' => $invoice,
        'invoiceItem' => $invoiceItem,
        'sale' => $sale,
    ];
}

test('a sale is recorded from an invoice line and its difference is computed', function () {
    $context = createSaleItemContext();

    $this->actingAs($context['user'])
        ->post(route('sale-items.store'), [
            'sale_id' => $context['sale']->id,
            'invoice_item_id' => $context['invoiceItem']->id,
            'unit_count' => 4,
            'real_price' => 25,
        ])
        ->assertSessionHasNoErrors();

    $saleItem = SaleItem::firstOrFail();

    expect($saleItem->sale_id)->toBe($context['sale']->id)
        ->and($saleItem->invoice_item_id)->toBe($context['invoiceItem']->id)
        ->and((float) $saleItem->unit_count)->toBe(4.0)
        ->and((float) $saleItem->real_price)->toBe(25.0)
        // (25 - 20) * 4 = 20
        ->and((float) $saleItem->total_diff)->toBe(20.0);

    // The sale is recalculated: 4 * 25 = 100
    expect((float) $context['sale']->fresh()->amount)->toBe(100.0);
});

test('a sale must belong to the same session as the invoice', function () {
    $context = createSaleItemContext();

    $otherSession = DailySession::create([
        'session_date' => '2026-06-02',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $otherSale = Sale::create([
        'date' => '2026-06-02',
        'customer_id' => $context['client']->id,
        'session_id' => $otherSession->id,
        'created_by' => $context['user']->id,
    ]);

    $this->actingAs($context['user'])
        ->post(route('sale-items.store'), [
            'sale_id' => $otherSale->id,
            'invoice_item_id' => $context['invoiceItem']->id,
            'unit_count' => 1,
            'real_price' => 20,
        ])
        ->assertSessionHas('error');

    expect(SaleItem::count())->toBe(0);
});

test('selling more than the remaining quantity is refused', function () {
    $context = createSaleItemContext();

    $this->actingAs($context['user'])
        ->post(route('sale-items.store'), [
            'sale_id' => $context['sale']->id,
            'invoice_item_id' => $context['invoiceItem']->id,
            'unit_count' => 11,
            'real_price' => 20,
        ])
        ->assertSessionHas('error');

    expect(SaleItem::count())->toBe(0);
});

test('an invoice line can be split across sales until it is exhausted', function () {
    $context = createSaleItemContext();

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'invoice_item_id' => $context['invoiceItem']->id,
        'unit_count' => 6,
        'real_price' => 20,
    ]);

    $secondClient = Customer::create(['name' => 'Second '.uniqid()]);
    $secondSale = Sale::create([
        'date' => '2026-06-01',
        'customer_id' => $secondClient->id,
        'session_id' => $context['session']->id,
        'created_by' => $context['user']->id,
    ]);

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $secondSale->id,
        'invoice_item_id' => $context['invoiceItem']->id,
        'unit_count' => 4,
        'real_price' => 22,
    ])
        ->assertSessionHasNoErrors();

    expect(SaleItem::count())->toBe(2)
        ->and((float) $context['sale']->fresh()->amount)->toBe(120.0) // 6 * 20
        ->and((float) $secondSale->fresh()->amount)->toBe(88.0); // 4 * 22

    // The line is now exhausted: one more unit is refused.
    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'invoice_item_id' => $context['invoiceItem']->id,
        'unit_count' => 1,
        'real_price' => 20,
    ])
        ->assertSessionHas('error');
});

test('updating a distribution recomputes the difference and the sale total', function () {
    $context = createSaleItemContext();

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'invoice_item_id' => $context['invoiceItem']->id,
        'unit_count' => 4,
        'real_price' => 25,
    ]);

    $saleItem = SaleItem::firstOrFail();

    $this->actingAs($context['user'])
        ->patch(route('sale-items.update', $saleItem->id), [
            'unit_count' => 8,
            'real_price' => 22,
        ])
        ->assertSessionHasNoErrors();

    $updated = $saleItem->fresh();

    // (22 - 20) * 8 = 16
    expect((float) $updated->total_diff)->toBe(16.0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(176.0); // 8 * 22
});

test('differences do not reduce the sellable quantity of a line', function () {
    $context = createSaleItemContext();

    // A difference covering the whole line does not block the sale.
    Difference::create([
        'invoice_item_id' => $context['invoiceItem']->id,
        'customer_id' => $context['client']->id,
        'item_id' => $context['item']->id,
        'unit_count' => 10,
        'real_price' => 30,
        'amount' => 300,
        'total_diff' => (30 - 20) * 10,
        'boxes' => 0,
        'position' => 0,
    ]);

    $this->actingAs($context['user'])
        ->post(route('sale-items.store'), [
            'sale_id' => $context['sale']->id,
            'invoice_item_id' => $context['invoiceItem']->id,
            'unit_count' => 10,
            'real_price' => 20,
        ])
        ->assertSessionHasNoErrors();

    expect(SaleItem::count())->toBe(1);
});

test('deleting a distribution frees the quantity and recalculates the sale', function () {
    $context = createSaleItemContext();

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'invoice_item_id' => $context['invoiceItem']->id,
        'unit_count' => 4,
        'real_price' => 25,
    ]);

    $saleItem = SaleItem::firstOrFail();

    expect((float) $context['sale']->fresh()->amount)->toBe(100.0);

    $this->actingAs($context['user'])
        ->delete(route('sale-items.destroy', $saleItem->id))
        ->assertSessionHasNoErrors();

    expect(SaleItem::count())->toBe(0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(0.0);
});
