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
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Les pages Inertia rendent app.blade.php : on évite la dépendance au manifest Vite.
    $this->withoutVite();
});

/**
 * Contexte minimal : une facture d'achat rattachée à une journée, deux lignes
 * de facture, chacune répartie en différence et distribuée à une vente.
 */
function createCascadeDeleteContext(string $date = '2026-06-01'): array
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
        'unit' => 'kg',
        'unit_count' => 100,
        'unit_price' => 20,
        'amount' => 2000,
        'position' => 0,
    ]);

    $secondItem = InvoiceItem::create([
        'invoice_id' => $invoice->id,
        'item_id' => $item->id,
        'boat_id' => $boat->id,
        'unit' => 'kg',
        'unit_count' => 50,
        'unit_price' => 20,
        'amount' => 1000,
        'position' => 1,
    ]);

    // Une différence par ligne de facture.
    Difference::create([
        'invoice_item_id' => $firstItem->id,
        'customer_id' => $client->id,
        'item_id' => $item->id,
        'unit_count' => 100,
        'real_price' => 25,
        'amount' => 2500,
        'total_diff' => 500,
        'boxes' => 0,
        'position' => 0,
    ]);

    Difference::create([
        'invoice_item_id' => $secondItem->id,
        'customer_id' => $client->id,
        'item_id' => $item->id,
        'unit_count' => 50,
        'real_price' => 25,
        'amount' => 1250,
        'total_diff' => 250,
        'boxes' => 0,
        'position' => 1,
    ]);

    $sale = Sale::create([
        'date' => $date,
        'customer_id' => $client->id,
        'session_id' => $session->id,
        'type' => 'normal',
    ]);

    // Une distribution par ligne de facture vers la même vente.
    SaleItem::create([
        'sale_id' => $sale->id,
        'invoice_item_id' => $firstItem->id,
        'unit_count' => 4,
        'real_price' => 25,
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'invoice_item_id' => $secondItem->id,
        'unit_count' => 2,
        'real_price' => 26,
    ]);

    $sale->calculateTotals();

    return [
        'user' => $user,
        'client' => $client,
        'boat' => $boat,
        'invoice' => $invoice,
        'firstItem' => $firstItem,
        'secondItem' => $secondItem,
        'sale' => $sale,
        'date' => $date,
    ];
}

test('deleting one invoice item also deletes its differences and sales', function () {
    $context = createCascadeDeleteContext();

    $this->actingAs($context['user'])
        ->delete(route('invoices.items.destroy', [$context['invoice'], $context['firstItem']]))
        ->assertRedirect();

    // The invoice line is soft-deleted, its differences hard-deleted and its
    // sale distributions soft-deleted.
    expect(InvoiceItem::withTrashed()->find($context['firstItem']->id)->trashed())->toBeTrue()
        ->and(Difference::count())->toBe(1)
        ->and(Difference::where('invoice_item_id', $context['firstItem']->id)->count())->toBe(0)
        ->and(SaleItem::withTrashed()->where('invoice_item_id', $context['firstItem']->id)->first()->deleted_at)->not->toBeNull()
        ->and(SaleItem::where('invoice_item_id', $context['secondItem']->id)->count())->toBe(1);

    // The sale totals no longer include the deleted distribution.
    $context['sale']->refresh();

    expect((float) $context['sale']->amount)->toBe(52.0)
        ->and((int) $context['sale']->boxes)->toBe(0);
});

test('the sales fiche no longer exposes data of a deleted invoice item', function () {
    $context = createCascadeDeleteContext();

    $this->actingAs($context['user'])
        ->delete(route('invoices.items.destroy', [$context['invoice'], $context['firstItem']]))
        ->assertRedirect();

    $this->actingAs($context['user'])
        ->get(route('sales.show', $context['sale']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sales-show')
            ->has('sale.items', 1)
            ->where('sale.items.0.invoice_item_id', $context['secondItem']->id));
});

test('the differences report no longer exposes a deleted invoice item', function () {
    $context = createCascadeDeleteContext();

    $this->actingAs($context['user'])
        ->delete(route('invoices.items.destroy', [$context['invoice'], $context['firstItem']]))
        ->assertRedirect();

    // Only the difference of the second line remains for this report.
    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['client']->id,
            'date' => $context['date'],
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->has('details', 1)
            ->where('details.0.unit_count', 50));
});

test('bulk deleting several invoice items cleans up all their differences and sales', function () {
    $context = createCascadeDeleteContext();

    $this->actingAs($context['user'])
        ->delete(route('invoices.items.destroyMany', $context['invoice']), [
            'ids' => [$context['firstItem']->id, $context['secondItem']->id],
        ])
        ->assertRedirect();

    // Every difference is gone and every distribution is soft-deleted.
    expect(Difference::count())->toBe(0)
        ->and(SaleItem::withTrashed()->whereNotNull('deleted_at')->count())->toBe(2)
        ->and(SaleItem::count())->toBe(0)
        ->and(InvoiceItem::count())->toBe(0);

    // The sale totals are recalculated to zero.
    $context['sale']->refresh();

    expect((float) $context['sale']->amount)->toBe(0.0)
        ->and((int) $context['sale']->boxes)->toBe(0)
        ->and((float) $context['sale']->weight)->toBe(0.0);
});

test('sales and differences pages expose nothing once all invoice items are deleted', function () {
    $context = createCascadeDeleteContext();

    $this->actingAs($context['user'])
        ->delete(route('invoices.items.destroyMany', $context['invoice']), [
            'ids' => [$context['firstItem']->id, $context['secondItem']->id],
        ])
        ->assertRedirect();

    // The sale fiche is now empty.
    $this->actingAs($context['user'])
        ->get(route('sales.show', $context['sale']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sales-show')
            ->has('sale.items', 0));

    // The differences report has no line left and falls back to the list.
    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['client']->id,
            'date' => $context['date'],
            'boat_id' => $context['boat']->id,
        ]))
        ->assertRedirect(route('differences'));
});
