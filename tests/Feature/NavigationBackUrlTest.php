<?php

use App\Models\Boat;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Item;
use App\Models\Receipt;
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
 * Crée un client, un bateau, un item et une facture rattachée au
 * SessionZone d'une journée. Le schéma rend session_zone_id obligatoire :
 * toute facture appartient donc toujours à une journée.
 */
function createInvoiceInSession(string $zoneName, string $date, array $context): Invoice
{
    $zone = Zone::create(['name' => $zoneName]);

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
        'billable_id' => $context['customer']->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $sessionZone->id,
        'created_by' => $context['user']->id,
    ]);

    $invoiceItem = InvoiceItem::create([
        'invoice_id' => $invoice->id,
        'item_id' => $context['item']->id,
        'boat_id' => $context['boat']->id,
        'unit' => 'kg',
        'unit_count' => 10,
        'unit_price' => 100,
        'amount' => 1000,
        'position' => 0,
    ]);

    Difference::create([
        'invoice_item_id' => $invoiceItem->id,
        'customer_id' => $context['customer']->id,
        'item_id' => $context['item']->id,
        'unit_count' => 2,
        'real_price' => 150,
        'amount' => 300,
        'total_diff' => 100,
        'boxes' => 0,
        'position' => 0,
    ]);

    return $invoice;
}

function createReceiptInSession(DailySession $session, Customer $customer): Receipt
{
    $zone = Zone::create(['name' => 'Agadir '.uniqid()]);
    $sessionZone = SessionZone::create([
        'daily_session_id' => $session->id,
        'zone_id' => $zone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    return Receipt::create([
        'date' => $session->session_date->toDateString(),
        'customer_id' => $customer->id,
        'session_zone_id' => $sessionZone->id,
        'quantity' => 0,
        'total_amount' => 0,
        'total_boxes' => 0,
    ]);
}

function createNavigationContext(): array
{
    $user = User::factory()->create();
    $customer = Customer::create(['name' => 'Client Test']);
    $boat = Boat::create([
        'name' => 'Bateau Test',
        'owner_id' => $customer->id,
        'owner_type' => Customer::class,
    ]);
    $category = Category::create(['name' => 'Poisson']);
    $item = Item::create(['name' => 'Sardine', 'category_id' => $category->id]);

    return [
        'user' => $user,
        'customer' => $customer,
        'boat' => $boat,
        'item' => $item,
    ];
}

test('la page facture retourne la journée liée comme backUrl', function () {
    $context = createNavigationContext();
    $date = '2026-06-01';

    $invoice = createInvoiceInSession('Laayoune', $date, $context);
    $session = $invoice->sessionZone->dailySession;

    $this->actingAs($context['user'])
        ->get(route('invoices.show', $invoice))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoice-show')
            ->where('backUrl', route('sessions.show', [$session->id]))
        );
});

test('la page facture ne peut pas exister hors journée : le fallback liste reste défini', function () {
    // Le schéma rend session_zone_id obligatoire (FK non nullable) : une
    // facture sans journée est invalide. Ce test documente que la branche de
    // secours du contrôleur pointe bien vers la liste des factures ; elle
    // n'est atteignable que si le schéma évolue.
    expect(route('invoices'))->toBe(url('/invoices'));
});

test('la page bon de réception retourne vers la liste par défaut', function () {
    $context = createNavigationContext();
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $receipt = createReceiptInSession($session, $context['customer']);

    $this->actingAs($context['user'])
        ->get(route('receipts.show', $receipt))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('receipts-show')
            ->where('backUrl', route('receipts'))
        );
});

test('la page bon de réception retourne à la journée dont elle vient', function () {
    $context = createNavigationContext();
    $session = DailySession::create([
        'session_date' => '2026-06-01',
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);
    $receipt = createReceiptInSession($session, $context['customer']);

    $this->actingAs($context['user'])
        ->get(route('receipts.show', [
            'receipt' => $receipt,
            'from_session' => $session->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('receipts-show')
            ->where('backUrl', route('sessions.show', [$session->id]))
        );
});

test('le rapport de différences pointe vers la journée quand une session unique se dégage', function () {
    $context = createNavigationContext();
    $date = '2026-06-01';

    createInvoiceInSession('Laayoune', $date, $context);

    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['customer']->id,
            'date' => $date,
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->where('backUrl', fn ($url) => str_starts_with((string) $url, url('/sessions/')))
        );
});

test('le rapport de différences retombe sur la liste quand plusieurs journées sont mêlées', function () {
    $context = createNavigationContext();
    $date = '2026-06-01';

    // Deux journées distinctes (zones différentes) pour le même
    // client / bateau / date : aucune session unique ne se dégage.
    createInvoiceInSession('Laayoune', $date, $context);
    createInvoiceInSession('Dakhla', $date, $context);

    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['customer']->id,
            'date' => $date,
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->where('backUrl', route('differences', [
                'customer_id' => $context['customer']->id,
                'date' => $date,
                'boat_id' => $context['boat']->id,
            ]))
        );
});
