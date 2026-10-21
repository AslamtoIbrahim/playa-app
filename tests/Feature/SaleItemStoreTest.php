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
    $this->withoutVite();
});

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
        'category_id' => $category->id,
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

    return compact('user', 'client', 'category', 'item', 'session', 'invoice', 'invoiceItem', 'sale');
}

function createSaleDifference(array $context, float $count = 4, float $price = 25): Difference
{
    return Difference::create([
        'invoice_item_id' => $context['invoiceItem']->id,
        'customer_id' => $context['client']->id,
        'item_id' => $context['item']->id,
        'unit_count' => $count,
        'real_price' => $price,
        'amount' => $count * $price,
        'total_diff' => ($price - $context['invoiceItem']->unit_price) * $count,
        'boxes' => 0,
        'position' => 0,
    ]);
}

test('a sale uses the customer and values from its invoice difference row', function () {
    $context = createSaleItemContext();
    $difference = createSaleDifference($context);

    $this->actingAs($context['user'])
        ->post(route('sale-items.store'), [
            'sale_id' => $context['sale']->id,
            'difference_id' => $difference->id,
        ])
        ->assertSessionHasNoErrors();

    $saleItem = SaleItem::firstOrFail();

    expect($saleItem->sale_id)->toBe($context['sale']->id)
        ->and($saleItem->invoice_item_id)->toBe($context['invoiceItem']->id)
        ->and($saleItem->difference_id)->toBe($difference->id)
        ->and((float) $saleItem->unit_count)->toBe(4.0)
        ->and((float) $saleItem->real_price)->toBe(25.0)
        ->and((float) $saleItem->difference->total_diff)->toBe(20.0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(100.0);

    $this->actingAs($context['user'])
        ->get(route('sessions.show', $context['session']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('sessions-show')
            ->where('totals.sell', 106.4)
            ->where('saleData.total', 106.4)
        );
});

test('global sale lines calculate boxes and weight from session category totals', function () {
    $context = createSaleItemContext();

    SaleItem::create([
        'sale_id' => $context['sale']->id,
        'invoice_item_id' => null,
        'item_id' => $context['item']->id,
        'unit_count' => -4,
        'sale_price' => 25,
        'real_price' => 20,
        'is_with_tax' => false,
    ]);

    expect((int) $context['sale']->fresh()->boxes)->toBe(-4)
        ->and((float) $context['sale']->fresh()->weight)->toBe(-84.0);
});

test('a sale must belong to the same session as the invoice', function () {
    $context = createSaleItemContext();
    $difference = createSaleDifference($context);
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
            'difference_id' => $difference->id,
        ])
        ->assertSessionHas('error');

    expect(SaleItem::count())->toBe(0);
});

test('a difference can be assigned to a sale belonging to another customer', function () {
    $context = createSaleItemContext();
    $difference = createSaleDifference($context);
    $otherClient = Customer::create(['name' => 'Other '.uniqid()]);
    $otherSale = Sale::create([
        'date' => '2026-06-01',
        'customer_id' => $otherClient->id,
        'session_id' => $context['session']->id,
        'created_by' => $context['user']->id,
    ]);

    $this->actingAs($context['user'])
        ->post(route('sale-items.store'), [
            'sale_id' => $otherSale->id,
            'difference_id' => $difference->id,
        ])
        ->assertSessionHasNoErrors();

    expect(SaleItem::count())->toBe(1)
        ->and((int) SaleItem::firstOrFail()->sale_id)->toBe($otherSale->id);

    $this->actingAs($context['user'])
        ->patch(route('sale-items.update', SaleItem::firstOrFail()), [
            'sale_id' => $context['sale']->id,
        ])
        ->assertSessionHasNoErrors();

    expect((int) SaleItem::firstOrFail()->sale_id)->toBe($context['sale']->id);
});

test('separate difference rows can be sold to their respective customers', function () {
    $context = createSaleItemContext();
    $firstDifference = createSaleDifference($context, 6, 20);
    $secondClient = Customer::create(['name' => 'Second '.uniqid()]);
    $secondSale = Sale::create([
        'date' => '2026-06-01',
        'customer_id' => $secondClient->id,
        'session_id' => $context['session']->id,
        'created_by' => $context['user']->id,
    ]);
    $secondDifference = Difference::create([
        'invoice_item_id' => $context['invoiceItem']->id,
        'customer_id' => $secondClient->id,
        'item_id' => $context['item']->id,
        'unit_count' => 4,
        'real_price' => 22,
        'amount' => 88,
        'total_diff' => 8,
        'boxes' => 0,
        'position' => 1,
    ]);

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'difference_id' => $firstDifference->id,
    ])->assertSessionHasNoErrors();

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $secondSale->id,
        'difference_id' => $secondDifference->id,
    ])->assertSessionHasNoErrors();

    expect(SaleItem::count())->toBe(2)
        ->and((float) $context['sale']->fresh()->amount)->toBe(120.0)
        ->and((float) $secondSale->fresh()->amount)->toBe(88.0);

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'difference_id' => $firstDifference->id,
    ])->assertSessionHas('error');
});

test('editing a difference updates its linked sale values directly', function () {
    $context = createSaleItemContext();
    $difference = createSaleDifference($context);

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'difference_id' => $difference->id,
    ]);

    $difference->update([
        'unit_count' => 8,
        'real_price' => 22,
        'amount' => 176,
        'total_diff' => 16,
    ]);

    $updated = SaleItem::firstOrFail();

    expect((float) $updated->unit_count)->toBe(8.0)
        ->and((float) $updated->real_price)->toBe(22.0)
        ->and((float) $updated->difference->total_diff)->toBe(16.0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(176.0);
});

test('a sold difference customer can change without changing the sale customer', function () {
    $context = createSaleItemContext();
    $difference = createSaleDifference($context);
    $otherClient = Customer::create(['name' => 'Other '.uniqid()]);

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'difference_id' => $difference->id,
    ]);

    $this->actingAs($context['user'])
        ->patch(route('differences.update', $difference->id), [
            'customer_id' => $otherClient->id,
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($context['user'])
        ->patch(route('sales.update', $context['sale']->id), [
            'date' => '2026-06-01',
            'customer_id' => $otherClient->id,
            'type' => 'normal',
        ])
        ->assertSessionHasErrors('customer_id');

    expect((int) $difference->fresh()->customer_id)->toBe($otherClient->id)
        ->and((int) $context['sale']->fresh()->customer_id)->toBe($context['client']->id);
});

test('deleting a sale assignment makes the difference available to sell again', function () {
    $context = createSaleItemContext();
    $difference = createSaleDifference($context);

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'difference_id' => $difference->id,
    ]);

    $saleItem = SaleItem::firstOrFail();

    $this->actingAs($context['user'])
        ->delete(route('sale-items.destroy', $saleItem->id))
        ->assertSessionHasNoErrors();

    expect(SaleItem::count())->toBe(0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(0.0);

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'difference_id' => $difference->id,
    ])->assertSessionHasNoErrors();

    expect(SaleItem::count())->toBe(1);
});

test('bulk deleting selected sale assignments removes only those assignments', function () {
    $context = createSaleItemContext();

    foreach ([1, 2] as $unitCount) {
        SaleItem::create([
            'sale_id' => $context['sale']->id,
            'invoice_item_id' => null,
            'item_id' => $context['item']->id,
            'unit_count' => -$unitCount,
            'sale_price' => 25,
            'real_price' => 20,
            'is_with_tax' => false,
        ]);
    }

    $saleItems = SaleItem::orderBy('id')->get();

    $this->actingAs($context['user'])
        ->delete(route('sale-items.destroy-many'), [
            'ids' => [$saleItems[0]->id],
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    expect(SaleItem::count())->toBe(1)
        ->and(SaleItem::firstOrFail()->id)->toBe($saleItems[1]->id);
});

test('bulk deleting a difference removes its linked sale assignment', function () {
    $context = createSaleItemContext();
    $difference = createSaleDifference($context);

    $this->actingAs($context['user'])->post(route('sale-items.store'), [
        'sale_id' => $context['sale']->id,
        'difference_id' => $difference->id,
    ]);

    $this->actingAs($context['user'])
        ->delete(route('differences.destroyMany'), ['ids' => [$difference->id]])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    expect(Difference::find($difference->id))->toBeNull()
        ->and(SaleItem::count())->toBe(0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(0.0);
});
