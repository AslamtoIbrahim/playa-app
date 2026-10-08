<?php

use App\Models\Boat;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleCharge;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function createSaleChargeContext(string $date = '2026-06-01'): array
{
    $user = User::factory()->create();
    $client = Customer::create(['name' => 'Client '.uniqid()]);
    $boat = Boat::create([
        'name' => 'Bateau '.uniqid(),
        'owner_id' => $client->id,
        'owner_type' => Customer::class,
    ]);

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

    $receipt = Receipt::create([
        'date' => $date,
        'customer_id' => $client->id,
        'session_zone_id' => $sessionZone->id,
        'boat_id' => $boat->id,
        'quantity' => 10,
        'total_amount' => 1000,
        'total_boxes' => 5,
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
        'session' => $session,
        'receipt' => $receipt,
        'sale' => $sale,
    ];
}

function createChargeSale(array $context): Sale
{
    return Sale::create([
        'date' => '2026-06-01',
        'customer_id' => $context['client']->id,
        'session_id' => $context['session']->id,
        'created_by' => $context['user']->id,
    ]);
}

test('a receipt amount is charged and added to its sale totals', function () {
    $context = createSaleChargeContext();

    $this->actingAs($context['user'])
        ->post(route('sale-charges.store'), [
            'sale_id' => $context['sale']->id,
            'receipt_id' => $context['receipt']->id,
            'amount' => 300,
        ])
        ->assertSessionHasNoErrors();

    $charge = SaleCharge::firstOrFail();

    expect($charge->sale_id)->toBe($context['sale']->id)
        ->and((float) $charge->amount)->toBe(300.0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(300.0);
});

test('a charge cannot exceed the remaining receipt amount', function () {
    $context = createSaleChargeContext();
    $secondSale = createChargeSale($context);

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $context['sale']->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 700,
    ])->assertSessionHasNoErrors();

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $secondSale->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 400,
    ])->assertSessionHas('error');

    expect(SaleCharge::count())->toBe(1);
});

test('a fully sold receipt refuses any new charge', function () {
    $context = createSaleChargeContext();
    $secondSale = createChargeSale($context);

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $context['sale']->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 1000,
    ])->assertSessionHasNoErrors();

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $secondSale->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 10,
    ])->assertSessionHas('error');

    expect(SaleCharge::count())->toBe(1);
});

test('updating a charge reuses its previous amount', function () {
    $context = createSaleChargeContext();

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $context['sale']->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 300,
    ]);

    $secondSale = createChargeSale($context);

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $secondSale->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 400,
    ]);

    $charge = SaleCharge::where('sale_id', $context['sale']->id)->firstOrFail();

    $this->actingAs($context['user'])
        ->patch(route('sale-charges.update', $charge->id), ['amount' => 600])
        ->assertSessionHasNoErrors();

    expect((float) $charge->fresh()->amount)->toBe(600.0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(600.0);

    $this->actingAs($context['user'])
        ->patch(route('sale-charges.update', $charge->id), ['amount' => 601])
        ->assertSessionHas('error');
});

test('deleting a charge frees the amount', function () {
    $context = createSaleChargeContext();

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $context['sale']->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 300,
    ]);

    $charge = SaleCharge::firstOrFail();

    $this->actingAs($context['user'])
        ->delete(route('sale-charges.destroy', $charge->id))
        ->assertSessionHasNoErrors();

    expect(SaleCharge::count())->toBe(0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(0.0)
        ->and((float) $context['receipt']->fresh()->remainingAmount())->toBe(1000.0);
});

test('moving a charge recalculates both sales', function () {
    $context = createSaleChargeContext();
    $secondSale = createChargeSale($context);

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $context['sale']->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 300,
    ]);

    $charge = SaleCharge::firstOrFail();

    $this->actingAs($context['user'])
        ->patch(route('sale-charges.update', $charge->id), ['sale_id' => $secondSale->id])
        ->assertSessionHasNoErrors();

    expect((float) $context['sale']->fresh()->amount)->toBe(0.0)
        ->and((float) $secondSale->fresh()->amount)->toBe(300.0);
});

test('a charge requires the same session on both sides', function () {
    $context = createSaleChargeContext('2026-06-01');

    $otherZone = Zone::create(['name' => 'Dakhla '.uniqid()]);
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

    SessionZone::create([
        'daily_session_id' => $otherSession->id,
        'zone_id' => $otherZone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $this->actingAs($context['user'])->post(route('sale-charges.store'), [
        'sale_id' => $otherSale->id,
        'receipt_id' => $context['receipt']->id,
        'amount' => 100,
    ])->assertSessionHas('error');

    expect(SaleCharge::count())->toBe(0);
});
