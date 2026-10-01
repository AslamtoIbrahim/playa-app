<?php

use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Invoice;
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
 * Create a daily session zone and an invoice attached to it, so the index page
 * exercises the same eager loaded relations as production.
 */
function createInvoiceForIndexPage(): array
{
    $zone = Zone::create(['name' => 'Zone '.uniqid()]);

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

    $customer = Customer::create(['name' => 'Client Test']);

    $invoice = Invoice::create([
        'date' => now()->toDateString(),
        'invoice_number' => 202600001,
        'billable_id' => $customer->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $sessionZone->id,
        'type' => 'sale',
    ]);

    return compact('sessionZone', 'customer', 'invoice');
}

test('the invoices index page renders the paginated invoices list', function () {
    $user = User::factory()->create();
    $context = createInvoiceForIndexPage();

    $this->actingAs($user)
        ->get(route('invoices'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices')
            ->has('invoices.data', 1)
            ->where('invoices.data.0.id', $context['invoice']->id)
            ->where('invoices.data.0.invoice_number', 202600001)
            ->where('invoices.data.0.session_zone.id', $context['sessionZone']->id)
        );
});

test('the invoices index page is read only', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('invoices'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices')
            ->missing('billables')
            ->missing('officeRooms')
            ->missing('sessionZones')
            ->missing('cautions')
        );
});
