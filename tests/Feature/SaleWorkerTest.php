<?php

use App\Models\Attendance;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Sale;
use App\Models\SaleWorker;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function createSaleWorkerContext(string $date = '2026-06-01'): array
{
    $user = User::factory()->create();
    $client = Customer::create(['name' => 'Client '.uniqid()]);

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

    $attendance = Attendance::create([
        'session_zone_id' => $sessionZone->id,
        'total_wage' => 1000,
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
        'sessionZone' => $sessionZone,
        'attendance' => $attendance,
        'sale' => $sale,
    ];
}

function createWorkerSale(array $context): Sale
{
    return Sale::create([
        'date' => '2026-06-01',
        'customer_id' => $context['client']->id,
        'session_id' => $context['session']->id,
        'created_by' => $context['user']->id,
    ]);
}

test('a wage amount is assigned and added to its sale totals', function () {
    $context = createSaleWorkerContext();

    $this->actingAs($context['user'])
        ->post(route('sale-workers.store'), [
            'sale_id' => $context['sale']->id,
            'attendance_id' => $context['attendance']->id,
            'amount' => 300,
        ])
        ->assertSessionHasNoErrors();

    $worker = SaleWorker::firstOrFail();

    expect($worker->sale_id)->toBe($context['sale']->id)
        ->and((float) $worker->amount)->toBe(300.0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(300.0);
});

test('an allocation cannot exceed the remaining attendance wage', function () {
    $context = createSaleWorkerContext();
    $secondSale = createWorkerSale($context);

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $context['sale']->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 700,
    ])->assertSessionHasNoErrors();

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $secondSale->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 400,
    ])->assertSessionHas('error');

    expect(SaleWorker::count())->toBe(1);
});

test('a fully allocated attendance refuses any new allocation', function () {
    $context = createSaleWorkerContext();
    $secondSale = createWorkerSale($context);

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $context['sale']->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 1000,
    ])->assertSessionHasNoErrors();

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $secondSale->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 0.01,
    ])->assertSessionHas('error');

    expect(SaleWorker::count())->toBe(1)
        ->and((float) $context['attendance']->fresh()->remainingAmount())->toBe(0.0);
});

test('the total wage is distributed until the remaining amount reaches zero', function () {
    $context = createSaleWorkerContext();
    $saleB = createWorkerSale($context);
    $saleC = createWorkerSale($context);

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $context['sale']->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 300,
    ])->assertSessionHasNoErrors();

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $saleB->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 500,
    ])->assertSessionHasNoErrors();

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $saleC->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 200,
    ])->assertSessionHasNoErrors();

    expect(SaleWorker::count())->toBe(3)
        ->and((float) $context['attendance']->fresh()->soldAmount())->toBe(1000.0)
        ->and((float) $context['attendance']->fresh()->remainingAmount())->toBe(0.0);
});

test('editing an allocation re-adds its current amount to the available wage', function () {
    $context = createSaleWorkerContext();
    $secondSale = createWorkerSale($context);

    // 1000 - 300 - 400 = 300 remaining; editing the 300 line gives 300 + 300 = 600.
    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $context['sale']->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 300,
    ]);

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $secondSale->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 400,
    ]);

    $worker = SaleWorker::where('sale_id', $context['sale']->id)->firstOrFail();

    $this->actingAs($context['user'])
        ->patch(route('sale-workers.update', $worker->id), ['amount' => 600])
        ->assertSessionHasNoErrors();

    $this->actingAs($context['user'])
        ->patch(route('sale-workers.update', $worker->id), ['amount' => 601])
        ->assertSessionHas('error');

    expect((float) $worker->fresh()->amount)->toBe(600.0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(600.0);
});

test('deleting an allocation frees the amount', function () {
    $context = createSaleWorkerContext();

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $context['sale']->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 300,
    ]);

    $worker = SaleWorker::firstOrFail();

    $this->actingAs($context['user'])
        ->delete(route('sale-workers.destroy', $worker->id))
        ->assertSessionHasNoErrors();

    expect(SaleWorker::count())->toBe(0)
        ->and((float) $context['sale']->fresh()->amount)->toBe(0.0)
        ->and((float) $context['attendance']->fresh()->remainingAmount())->toBe(1000.0);
});

test('moving an allocation recalculates both sales', function () {
    $context = createSaleWorkerContext();
    $secondSale = createWorkerSale($context);

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $context['sale']->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 300,
    ]);

    $worker = SaleWorker::firstOrFail();

    $this->actingAs($context['user'])
        ->patch(route('sale-workers.update', $worker->id), ['sale_id' => $secondSale->id])
        ->assertSessionHasNoErrors();

    expect((float) $context['sale']->fresh()->amount)->toBe(0.0)
        ->and((float) $secondSale->fresh()->amount)->toBe(300.0);
});

test('an allocation requires the same session on both sides', function () {
    $context = createSaleWorkerContext('2026-06-01');

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

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $otherSale->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 100,
    ])->assertSessionHas('error');

    expect(SaleWorker::count())->toBe(0);
});

test('an allocation is refused when the session is closed', function () {
    $context = createSaleWorkerContext();

    $context['session']->update(['status' => 'closed']);

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $context['sale']->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 100,
    ])->assertSessionHas('error');

    expect(SaleWorker::count())->toBe(0);
});

test('moving an allocation to another attendance uses the new available wage', function () {
    $context = createSaleWorkerContext();

    $otherAttendance = Attendance::create([
        'session_zone_id' => $context['sessionZone']->id,
        'total_wage' => 400,
    ]);

    $this->actingAs($context['user'])->post(route('sale-workers.store'), [
        'sale_id' => $context['sale']->id,
        'attendance_id' => $context['attendance']->id,
        'amount' => 300,
    ]);

    $worker = SaleWorker::firstOrFail();

    // The new attendance has 400 available: 350 is accepted, 401 is refused.
    $this->actingAs($context['user'])
        ->patch(route('sale-workers.update', $worker->id), [
            'attendance_id' => $otherAttendance->id,
            'amount' => 350,
        ])
        ->assertSessionHasNoErrors();

    expect((int) $worker->fresh()->attendance_id)->toBe($otherAttendance->id)
        ->and((float) $otherAttendance->fresh()->remainingAmount())->toBe(50.0)
        ->and((float) $context['attendance']->fresh()->remainingAmount())->toBe(1000.0);

    $this->actingAs($context['user'])
        ->patch(route('sale-workers.update', $worker->id), [
            'attendance_id' => $otherAttendance->id,
            'amount' => 401,
        ])
        ->assertSessionHas('error');
});
