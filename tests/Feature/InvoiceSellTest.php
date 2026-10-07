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

uses(RefreshDatabase::class);

beforeEach(function () {
    // Inertia pages render app.blade.php: avoid the Vite manifest dependency.
    $this->withoutVite();
});

/**
 * Full context: an open daily session, a purchase invoice carrying two lines
 * and a sale of the customer in the same session.
 *
 * Line 1: 10 units at 20 (weight 210, 10 boxes).
 * Line 2: 5 units at 40 (weight 105, 5 boxes).
 */
function createInvoiceSellContext(string $date = '2026-06-01'): array
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

    $firstItem = InvoiceItem::create([
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

    $secondItem = InvoiceItem::create([
        'invoice_id' => $invoice->id,
        'item_id' => $item->id,
        'boat_id' => $boat->id,
        'unit' => 'caisse',
        'unit_count' => 5,
        'unit_price' => 40,
        'weight' => 105,
        'box' => 5,
        'amount' => 200,
        'position' => 1,
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
        'firstItem' => $firstItem,
        'secondItem' => $secondItem,
        'sale' => $sale,
    ];
}

test('the whole invoice is sold to one customer at the invoiced price', function () {
    $context = createInvoiceSellContext();

    $this->actingAs($context['user'])
        ->post(route('invoices.sell', $context['invoice']), [
            'customer_id' => $context['client']->id,
        ])
        ->assertSessionHasNoErrors();

    expect(SaleItem::count())->toBe(2);

    $saleItems = SaleItem::orderBy('id')->get();

    // Both lines are fully distributed at the invoiced price: no difference.
    expect((float) $saleItems[0]->unit_count)->toBe(10.0)
        ->and((float) $saleItems[0]->real_price)->toBe(20.0)
        ->and((float) $saleItems[0]->total_diff)->toBe(0.0)
        ->and((float) $saleItems[1]->unit_count)->toBe(5.0)
        ->and((float) $saleItems[1]->real_price)->toBe(40.0)
        ->and((float) $saleItems[1]->total_diff)->toBe(0.0);

    // Sale totals: 200 + 200, weight 315, 15 boxes.
    $sale = $context['sale']->fresh();

    expect((float) $sale->amount)->toBe(400.0)
        ->and((float) $sale->weight)->toBe(315.0)
        ->and((int) $sale->boxes)->toBe(15);
});

test('a sale is created for the customer when none exists in the session', function () {
    $context = createInvoiceSellContext();

    // No sale of that customer in the session: the sell creates one.
    $context['sale']->delete();

    $this->actingAs($context['user'])
        ->post(route('invoices.sell', $context['invoice']), [
            'customer_id' => $context['client']->id,
        ])
        ->assertSessionHasNoErrors();

    expect(Sale::count())->toBe(1);

    $sale = Sale::first();

    expect((int) $sale->customer_id)->toBe((int) $context['client']->id)
        ->and((int) $sale->session_id)->toBe((int) $context['session']->id)
        ->and($sale->type)->toBe('normal')
        ->and((int) $sale->created_by)->toBe((int) $context['user']->id)
        ->and(substr($sale->date, 0, 10))->toBe('2026-06-01')
        ->and(SaleItem::count())->toBe(2);
});

test('the existing sale of the customer in the session is reused', function () {
    $context = createInvoiceSellContext();

    $this->actingAs($context['user'])
        ->post(route('invoices.sell', $context['invoice']), [
            'customer_id' => $context['client']->id,
        ])
        ->assertSessionHasNoErrors();

    expect(Sale::count())->toBe(1)
        ->and(SaleItem::where('sale_id', $context['sale']->id)->count())->toBe(2);
});

test('a closed session refuses to sell the invoice', function () {
    $context = createInvoiceSellContext();

    $context['session']->update(['status' => 'closed']);

    $this->actingAs($context['user'])
        ->from(route('sessions.show', $context['session']->id))
        ->post(route('invoices.sell', $context['invoice']), [
            'customer_id' => $context['client']->id,
        ])
        ->assertSessionHas('error');

    expect(SaleItem::count())->toBe(0);
});

test('an already fully sold invoice is refused', function () {
    $context = createInvoiceSellContext();

    $this->actingAs($context['user'])
        ->post(route('invoices.sell', $context['invoice']), [
            'customer_id' => $context['client']->id,
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($context['user'])
        ->from(route('sessions.show', $context['session']->id))
        ->post(route('invoices.sell', $context['invoice']), [
            'customer_id' => $context['client']->id,
        ])
        ->assertSessionHas('error');

    expect(SaleItem::count())->toBe(2);
});

test('only the remaining quantity of a partially sold line is distributed', function () {
    $context = createInvoiceSellContext();

    // The first line is already partially sold (4 of 10 units).
    $context['firstItem']->saleItems()->create([
        'sale_id' => $context['sale']->id,
        'unit_count' => 4,
        'real_price' => 20,
    ]);

    $this->actingAs($context['user'])
        ->post(route('invoices.sell', $context['invoice']), [
            'customer_id' => $context['client']->id,
        ])
        ->assertSessionHasNoErrors();

    // First line: 4 already sold + 6 remaining = 10 units in total.
    expect((float) SaleItem::where('invoice_item_id', $context['firstItem']->id)->sum('unit_count'))->toBe(10.0)
        ->and(SaleItem::where('invoice_item_id', $context['firstItem']->id)->count())->toBe(2)
        ->and(SaleItem::where('invoice_item_id', $context['secondItem']->id)->count())->toBe(1);

    // The whole invoice is still sold at the invoiced price: totals unchanged.
    $sale = $context['sale']->fresh();

    expect((float) $sale->amount)->toBe(400.0)
        ->and((float) $sale->weight)->toBe(315.0)
        ->and((int) $sale->boxes)->toBe(15);
});

test('customer_id is required with a French validation message', function () {
    $context = createInvoiceSellContext();

    $this->actingAs($context['user'])
        ->post(route('invoices.sell', $context['invoice']), [])
        ->assertSessionHasErrors([
            'customer_id' => 'Veuillez choisir le client vendeur.',
        ]);

    expect(SaleItem::count())->toBe(0);
});

test('an unknown customer is refused', function () {
    $context = createInvoiceSellContext();

    $this->actingAs($context['user'])
        ->post(route('invoices.sell', $context['invoice']), [
            'customer_id' => 999999,
        ])
        ->assertSessionHasErrors('customer_id');

    expect(SaleItem::count())->toBe(0);
});
