<?php

use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\Sale;
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
 * Creates an open daily session holding one session zone, so purchase invoices
 * and sales can be attached to it exactly like the real flow does.
 *
 * @return array{session: DailySession, sessionZone: SessionZone}
 */
function createDashboardContext(): array
{
    $zone = Zone::create(['name' => 'Zone Dashboard']);

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

    return ['session' => $session, 'sessionZone' => $sessionZone];
}

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('the dashboard exposes the recent purchases and sales', function () {
    $context = createDashboardContext();
    $customer = Customer::create(['name' => 'Client Dashboard']);

    Invoice::create([
        'date' => now()->toDateString(),
        'invoice_number' => 202699001,
        'type' => 'purchase',
        'billable_id' => $customer->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $context['sessionZone']->id,
        'amount' => 1500,
    ]);

    Sale::create([
        'date' => now()->toDateString(),
        'customer_id' => $customer->id,
        'session_id' => $context['session']->id,
        'type' => 'normal',
        'amount' => 2200,
    ]);

    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('stats')
            ->has('trend', 14)
            ->has('recentPurchases', 1)
            ->has('recentSales', 1)
            ->where('recentPurchases.0.amount', 1500)
            ->where('recentPurchases.0.owner', 'Client dashboard')
            ->where('recentSales.0.amount', 2200)
            ->where('recentSales.0.customer', 'Client dashboard')
        );
});

test('the dashboard trend ends today and carries the daily totals', function () {
    $context = createDashboardContext();
    $customer = Customer::create(['name' => 'Client Trend']);

    Invoice::create([
        'date' => now()->toDateString(),
        'invoice_number' => 202699002,
        'type' => 'purchase',
        'billable_id' => $customer->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $context['sessionZone']->id,
        'amount' => 800,
    ]);

    $today = now()->toDateString();

    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('trend.13.date', $today)
            ->where('trend.13.buy', fn ($buy) => (float) $buy === 800.0)
            ->where('trend.13.sell', 0)
        );
});
