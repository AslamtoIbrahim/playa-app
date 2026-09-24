<?php

use App\Models\Attendance;
use App\Models\AttendanceItem;
use App\Models\Boat;
use App\Models\Category;
use App\Models\Caution;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Item;
use App\Models\OfficeRoom;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Worker;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Les pages Inertia rendent app.blade.php : on évite la dépendance au manifest Vite.
    $this->withoutVite();
});

/**
 * Crée une journée (session) avec une zone, plus une facture d'achat,
 * une réception, une différence et un pointage rattachés au SessionZone.
 */
function createSessionWithTransactions(): array
{
    $zone = Zone::create(['name' => 'laayoune']);

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

    $category = Category::create(['name' => 'Poisson']);
    $item = Item::create(['name' => 'Sardine', 'category_id' => $category->id]);

    $customer = Customer::create(['name' => 'Client Test']);
    $boat = Boat::create([
        'name' => 'Bateau Test',
        'owner_id' => $customer->id,
        'owner_type' => Customer::class,
    ]);

    // --- Caution rattachée à la facture d'achat
    $caution = Caution::create([
        'name' => 'CIH',
        'owner_id' => $customer->id,
        'owner_type' => Customer::class,
    ]);

    // --- Facture d'achat : rattachée au SessionZone (pas de session_id sur invoices)
    $purchaseInvoice = Invoice::create([
        'date' => now()->toDateString(),
        'invoice_number' => 202600001,
        'type' => 'purchase',
        'billable_id' => $customer->id,
        'billable_type' => Customer::class,
        'caution_id' => $caution->id,
        'session_zone_id' => $sessionZone->id,
        'amount' => 1000,
        'boxes' => 3,
    ]);

    $purchaseInvoiceItem = InvoiceItem::create([
        'invoice_id' => $purchaseInvoice->id,
        'item_id' => $item->id,
        'boat_id' => $boat->id,
        'unit' => 'kg',
        'unit_count' => 10,
        'unit_price' => 100,
        'amount' => 1000,
        'position' => 0,
    ]);

    // Différence liée à la ligne de facture d'achat
    $difference = Difference::create([
        'invoice_item_id' => $purchaseInvoiceItem->id,
        'customer_id' => $customer->id,
        'item_id' => $item->id,
        'unit_count' => 2,
        'real_price' => 150,
        'amount' => 300,
        'total_diff' => 100,
        'boxes' => 0,
        'position' => 0,
    ]);

    // --- Réception (bon) rattachée au SessionZone
    $receipt = Receipt::create([
        'date' => now()->toDateString(),
        'customer_id' => $customer->id,
        'session_zone_id' => $sessionZone->id,
        'boat_id' => $boat->id,
        'quantity' => 5,
        'total_amount' => 500,
        'total_boxes' => 1,
    ]);

    ReceiptItem::create([
        'receipt_id' => $receipt->id,
        'invoice_item_id' => $purchaseInvoiceItem->id,
        'item_id' => $item->id,
        'unit_count' => 5,
        'real_price' => 100,
        'total_diff' => 0,
        'position' => 0,
        'type' => 'item',
    ]);

    // --- Pointage ouvriers rattaché au SessionZone
    $worker = Worker::create(['name' => 'Ouvrier Test']);

    $attendance = Attendance::create([
        'session_zone_id' => $sessionZone->id,
        'total_wage' => 200,
    ]);

    AttendanceItem::create([
        'attendance_id' => $attendance->id,
        'worker_id' => $worker->id,
        'wage' => 200,
    ]);

    return compact(
        'session',
        'zone',
        'sessionZone',
        'purchaseInvoice',
        'difference',
        'receipt',
        'attendance',
        'customer',
        'boat',
    );
}

test('la page show renvoie les données rattachées au SessionZone', function () {
    $data = createSessionWithTransactions();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sessions.show', $data['session']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sessions-show')
            ->where('session.id', $data['session']->id)
            // Factures d'achat : lues via session_zone_id
            ->has('purchaseData.invoices', 1)
            ->where('purchaseData.invoices.0.invoice_number', 202600001)
            ->where('purchaseData.invoices.0.billable.name', 'Client test')
            // Caution : le nom est normalisé par l'accessor (lowercase + ucfirst)
            ->where('purchaseData.invoices.0.caution.name', 'Cih')
            ->where('purchaseData.invoices.0.boxes', 3)
            // Réceptions d'achat : lues via session_zone_id
            ->has('purchaseData.receipts', 1)
            // Différences d'achat : via invoice_item.invoice.session_zone_id
            ->has('purchaseData.differences', 1)
            ->has('purchaseData.differences.0.item')
            // Ouvriers : via session_zone_id
            ->has('attendances', 1)
            ->has('attendances.0.items', 1)
            // Totaux achat = factures (1000) + différences (100) + réceptions (500)
            //                  + masse salariale des pointages (200)
            ->where('totals.attendance', fn ($total) => (float) $total === 200.0)
            ->where('purchaseData.total', fn ($total) => (float) $total === 1800.0)
            ->where('totals.buy', fn ($total) => (float) $total === 1800.0)
            // Aucune vente dans cette session
            ->has('saleData.invoices', 0)
            ->has('saleData.receipts', 0)
            ->has('saleData.differences', 0)
            ->has('saleData.sales', 0)
            ->where('totals.sell', 0)
            // Les ouvriers sont une charge : la marge en tient compte.
            ->where('totals.margin', fn ($total) => (float) $total === -1800.0)
        );
});

test('les données d\'une autre session ne fuient pas dans la session affichée', function () {
    $data = createSessionWithTransactions();
    $user = User::factory()->create();

    // Deuxième journée, sans aucune opération
    $otherZone = Zone::create(['name' => 'Dakhla']);

    $otherSession = DailySession::create([
        'session_date' => now()->subDay()->startOfDay(),
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    SessionZone::create([
        'daily_session_id' => $otherSession->id,
        'zone_id' => $otherZone->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    $this->actingAs($user)
        ->get(route('sessions.show', $otherSession))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sessions-show')
            ->where('session.id', $otherSession->id)
            ->has('purchaseData.invoices', 0)
            ->has('purchaseData.receipts', 0)
            ->has('purchaseData.differences', 0)
            ->has('attendances', 0)
            ->where('totals.buy', 0)
            ->where('totals.sell', 0)
        );

    // Sanity check : la session d'origine contient bien les opérations
    expect(Invoice::where('session_zone_id', $data['sessionZone']->id)->count())->toBe(1);
});

test('la liste des sessions calcule les totaux via le SessionZone', function () {
    $data = createSessionWithTransactions();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('sessions'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sessions')
            ->has('sessions', 1)
            ->where('sessions.0.id', $data['session']->id)
            ->where('sessions.0.total_buy', fn ($total) => (float) $total === 1800.0)
            ->where('sessions.0.total_sell', 0)
        );
});

test('la page de la journée expose les données du dialogue de création de facture', function () {
    $data = createSessionWithTransactions();
    $user = User::factory()->create();

    $officeRoom = OfficeRoom::create(['name' => 'Bureau Test', 'city' => 'casablanca']);

    $this->actingAs($user)
        ->get(route('sessions.show', $data['session']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sessions-show')
            // Comptes : client et/ou société
            ->has('billables', 1)
            ->where('billables.0.name', 'Client test')
            ->where('billables.0.type', Customer::class)
            // Bureaux : la ville est normalisée par l'accessor du modèle
            ->has('officeRooms', 1)
            ->where('officeRooms.0.id', $officeRoom->id)
            ->where('officeRooms.0.city', 'Casablanca')
            // Cautions : rattachées au compte de la facture
            ->has('cautions', 1)
            ->where('cautions.0.owner_id', $data['customer']->id)
            ->where('cautions.0.owner_type', Customer::class)
            // Zones de la journée : remplacent le choix session/zone du dialogue
            ->has('sessionZones', 1)
            ->where('sessionZones.0.id', $data['sessionZone']->id)
            ->where('sessionZones.0.zone_id', $data['zone']->id)
            ->where(
                'sessionZones.0.daily_session.session_date',
                fn ($date) => str_starts_with((string) $date, $data['session']->session_date->toDateString()),
            )
            // Données du dialogue de création de bon de réception
            ->has('customers', 1)
            ->where('customers.0.id', $data['customer']->id)
            ->where('customers.0.name', 'Client test')
            ->has('boats', 1)
            ->where('boats.0.id', $data['boat']->id)
            ->where('boats.0.name', 'Bateau test')
        );
});
