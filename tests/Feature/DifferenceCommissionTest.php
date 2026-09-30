<?php

use App\Models\Boat;
use App\Models\Category;
use App\Models\Company;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Item;
use App\Models\Receipt;
use App\Models\ReceiptItem;
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
 * Contexte minimal du rapport : un client destinataire, un bateau, un article,
 * une facture rattachée à une journée et sa répartition.
 *
 * Le propriétaire du bateau est un client par défaut ; on peut le remplacer par
 * une société pour couvrir l'autre branche du morph.
 */
function createCommissionContext(string $date = '2026-06-01', bool $companyOwner = false): array
{
    $user = User::factory()->create();
    $client = Customer::create(['name' => 'Client '.uniqid()]);

    $owner = $companyOwner
        ? Company::create(['name' => 'Societe '.uniqid()])
        : Customer::create(['name' => 'Proprietaire '.uniqid()]);

    $boat = Boat::create([
        'name' => 'Bateau '.uniqid(),
        'owner_id' => $owner->id,
        'owner_type' => $companyOwner ? Company::class : Customer::class,
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
        'unit' => 'kg',
        'unit_count' => 100,
        'unit_price' => 20,
        'amount' => 2000,
        'position' => 0,
    ]);

    Difference::create([
        'invoice_item_id' => $invoiceItem->id,
        'customer_id' => $client->id,
        'item_id' => $item->id,
        'unit_count' => 100,
        'real_price' => 25,
        'amount' => 2500,
        'total_diff' => 500,
        'boxes' => 0,
        'position' => 0,
    ]);

    return [
        'user' => $user,
        'client' => $client,
        'owner' => $owner,
        'boat' => $boat,
        'item' => $item,
        'sessionZone' => $sessionZone,
        'invoice' => $invoice,
        'invoiceItem' => $invoiceItem,
    ];
}

test('le rapport expose le bateau et son propriétaire pour les commissions', function () {
    $context = createCommissionContext();

    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['client']->id,
            'date' => '2026-06-01',
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->has('customers')
            ->where('boat.id', $context['boat']->id)
            ->where('boat.name', $context['boat']->name)
            ->where('boat.owner_name', $context['owner']->name)
            ->where('boat.owner_is_company', false)
            ->where('boat.session_zone_id', $context['sessionZone']->id)
        );
});

test('une commission n’est rattachée ni à un article ni à une facture', function () {
    $context = createCommissionContext();

    $this->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $context['client']->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect();

    // Les deux lignes sont ancrées sur le bateau, jamais sur l'article.
    $items = ReceiptItem::where('type', 'commission')->get();

    expect($items)->toHaveCount(2)
        ->and($items->whereNull('invoice_item_id')->count())->toBe(2);
});

test('une commission crédite le bénéficiaire et débite le propriétaire du bateau', function () {
    $context = createCommissionContext();

    $this->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $context['client']->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $items = ReceiptItem::where('type', 'commission')
        ->with('receipt')
        ->get();

    expect($items)->toHaveCount(2);

    $beneficiary = $items->firstWhere(fn ($item) => $item->real_price > 0);
    $ownerItem = $items->firstWhere(fn ($item) => $item->real_price < 0);

    expect((float) $beneficiary->unit_count)->toBe(10.0)
        ->and((float) $beneficiary->real_price)->toBe(2.5)
        ->and($beneficiary->receipt->customer_id)->toBe($context['client']->id)
        ->and((float) $ownerItem->unit_count)->toBe(10.0)
        ->and((float) $ownerItem->real_price)->toBe(-2.5)
        ->and($ownerItem->receipt->customer_id)->toBe($context['owner']->id)
        ->and($ownerItem->receipt->boat_id)->toBe($context['boat']->id);
});

test('un propriétaire société reçoit la part du bénéficiaire sans bon négatif', function () {
    $context = createCommissionContext('2026-06-01', companyOwner: true);

    $this->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $context['client']->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    // La table receipts ne référence que des clients : une seule jambe est
    // écrite, celle du bénéficiaire.
    $items = ReceiptItem::where('type', 'commission')->get();

    expect($items)->toHaveCount(1)
        ->and((float) $items->first()->real_price)->toBe(2.5)
        ->and($items->first()->receipt->customer_id)->toBe($context['client']->id);
});

test('la commission enregistrée réapparaît dans le rapport du propriétaire', function () {
    $context = createCommissionContext();

    $this->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $context['client']->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect();

    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['owner']->id,
            'date' => '2026-06-01',
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->has('details', 1)
            ->where('details.0.type', 'commission')
            ->where('details.0.total_diff', fn ($value) => (float) $value === -25.0)
        );
});

/**
 * Régression : un rapport composé uniquement de bons de réception (le cas du
 * propriétaire qui consulte ses commissions) n'a aucune facture, donc
 * `details[0].invoice_item.invoice.date` est vide. La dialog doit quand même
 * pouvoir enregistrer une commission avec la date du rapport.
 */
test('la commission s’enregistre depuis un rapport sans facture (bons de réception seuls)', function () {
    $context = createCommissionContext();

    // Une réception sur le bateau du propriétaire, sans aucune différence.
    $receipt = Receipt::create([
        'date' => '2026-06-01',
        'customer_id' => $context['owner']->id,
        'session_zone_id' => $context['sessionZone']->id,
        'boat_id' => $context['boat']->id,
        'quantity' => 0,
        'total_amount' => 0,
        'total_boxes' => 0,
    ]);

    $receipt->items()->create([
        'item_id' => $context['item']->id,
        'unit_count' => 50,
        'real_price' => 30,
        'type' => 'item',
    ]);

    // Le rapport du propriétaire ne contient que des lignes is_extra.
    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['owner']->id,
            'date' => '2026-06-01',
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->has('details', 1)
            ->where('details.0.is_extra', true)
            // Aucune facture derrière : le premier détail n'a pas de date.
            ->where('details.0.invoice_item.invoice', null)
            // ... mais la page doit quand même exposer la date du rapport.
            ->where('boat.date', '2026-06-01')
            ->where('boat.session_zone_id', $context['sessionZone']->id)
        );

    // Et l'enregistrement doit fonctionner avec cette date.
    $this->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $context['client']->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
});

test('le rapport renvoie les commissions existantes pour les réafficher', function () {
    $context = createCommissionContext();

    $this->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $context['client']->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect();

    // On consulte ici le rapport du client lui-même : c'est un cas particulier
    // où le bénéficiaire se trouve être aussi le client du rapport. Le cas
    // courant (rapport du propriétaire) est couvert plus bas.
    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['client']->id,
            'date' => '2026-06-01',
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            // Une seule jambe est renvoyée : celle du bénéficiaire.
            ->has('boat.commissions', 1)
            ->where('boat.commissions.0.beneficiary_id', $context['client']->id)
            ->where('boat.commissions.0.unit_count', 10)
            ->where('boat.commissions.0.commission_per_unit', 2.5)
            ->where('boat.commissions.0.receipt_id', fn ($id) => (int) $id > 0)
        );
});

/**
 * Scénario réel : le rapport consulté est celui du PROPRIÉTAIRE du bateau,
 * et le bénéficiaire est un autre client. Le bon du bénéficiaire n'a pas de
 * boat_id, il n'apparaît donc jamais dans les receipts du rapport.
 */
test('le rapport du propriétaire renvoie ses commissions existantes', function () {
    $context = createCommissionContext();
    $beneficiary = Customer::create(['name' => 'Beneficiaire '.uniqid()]);

    $this->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $beneficiary->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect();

    // Le bon du bénéficiaire n'a pas de boat_id : il est invisible dans les
    // receipts du rapport, qui filtre sur le bateau.
    $beneficiaryReceipt = Receipt::where('customer_id', $beneficiary->id)->firstOrFail();

    expect($beneficiaryReceipt->boat_id)->toBeNull();

    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['owner']->id,
            'date' => '2026-06-01',
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->has('boat.commissions', 1)
            ->where('boat.commissions.0.beneficiary_id', $beneficiary->id)
            ->where('boat.commissions.0.beneficiary_name', $beneficiary->name)
            ->where('boat.commissions.0.unit_count', 10)
            ->where('boat.commissions.0.commission_per_unit', 2.5)
        );
});

test('les commissions d’un autre bateau ne remontent pas', function () {
    $context = createCommissionContext();

    $otherBoat = Boat::create([
        'name' => 'Autre bateau '.uniqid(),
        'owner_id' => $context['owner']->id,
        'owner_type' => $context['owner']::class,
    ]);

    $beneficiary = Customer::create(['name' => 'Beneficiaire '.uniqid()]);

    // Une commission sur le bateau, une sur l'autre.
    foreach ([$context['boat']->id, $otherBoat->id] as $boatId) {
        $this->actingAs($context['user'])
            ->post(route('receipts.items.storeCommission'), [
                'boat_id' => $boatId,
                'beneficiary_id' => $beneficiary->id,
                'commission_per_unit' => 2.5,
                'unit_count' => 10,
                'session_zone_id' => $context['sessionZone']->id,
                'date' => '2026-06-01',
            ])
            ->assertRedirect();
    }

    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['owner']->id,
            'date' => '2026-06-01',
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->has('boat.commissions', 1)
            ->where('boat.commissions.0.unit_count', 10)
        );
});

test('modifier une commission met à jour les deux jambes', function () {
    $context = createCommissionContext();

    $this->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $context['client']->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect();

    $beneficiaryItem = ReceiptItem::where('type', 'commission')
        ->where('real_price', '>', 0)
        ->firstOrFail();

    // La jambe du propriétaire est retrouvée via commission_twin_id.
    expect($beneficiaryItem->commission_twin_id)->not->toBeNull();

    $this->actingAs($context['user'])
        ->put(route('receipts.items.updateCommission', [
            'receipt' => $beneficiaryItem->receipt_id,
            'item' => $beneficiaryItem->id,
        ]), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $context['client']->id,
            'commission_per_unit' => 4,
            'unit_count' => 20,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $beneficiaryItem->refresh();
    $twin = ReceiptItem::find($beneficiaryItem->commission_twin_id);

    expect((float) $beneficiaryItem->unit_count)->toBe(20.0)
        ->and((float) $beneficiaryItem->real_price)->toBe(4.0)
        ->and((float) $twin->unit_count)->toBe(20.0)
        ->and((float) $twin->real_price)->toBe(-4.0);
});

test('deux commissions au même prix ne se mélangent pas à la mise à jour', function () {
    $context = createCommissionContext();

    $other = Customer::create(['name' => 'Autre '.uniqid()]);

    // Deux commissions strictement identiques (même prix, même quantité).
    foreach ([$context['client'], $other] as $beneficiary) {
        $this->actingAs($context['user'])
            ->post(route('receipts.items.storeCommission'), [
                'boat_id' => $context['boat']->id,
                'beneficiary_id' => $beneficiary->id,
                'commission_per_unit' => 2.5,
                'unit_count' => 10,
                'session_zone_id' => $context['sessionZone']->id,
                'date' => '2026-06-01',
            ])
            ->assertRedirect();
    }

    $target = ReceiptItem::where('type', 'commission')
        ->where('real_price', '>', 0)
        ->whereHas('receipt', fn ($q) => $q->where('customer_id', $other->id))
        ->firstOrFail();

    $this->actingAs($context['user'])
        ->put(route('receipts.items.updateCommission', [
            'receipt' => $target->receipt_id,
            'item' => $target->id,
        ]), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $other->id,
            'commission_per_unit' => 7,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect();

    $target->refresh();

    // Seule la commission visée change : l'autre reste à 2.50.
    $untouched = ReceiptItem::where('type', 'commission')
        ->where('real_price', '>', 0)
        ->whereHas('receipt', fn ($q) => $q->where('customer_id', $context['client']->id))
        ->firstOrFail();

    expect((float) $target->real_price)->toBe(7.0)
        ->and((float) $untouched->real_price)->toBe(2.5)
        ->and($untouched->commission_twin_id)->not->toBe($target->commission_twin_id);
});

/**
 * Saves a commission through the store route, the way the dialog does.
 */
function storeCommissionFor(array $context, int $beneficiaryId, float $price = 2.5, float $unitCount = 10): void
{
    test()->actingAs($context['user'])
        ->post(route('receipts.items.storeCommission'), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $beneficiaryId,
            'commission_per_unit' => $price,
            'unit_count' => $unitCount,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
}

/**
 * The beneficiary leg of a commission: the only line with a positive amount.
 */
function beneficiaryCommissionItem(): ReceiptItem
{
    return ReceiptItem::where('type', 'commission')
        ->where('real_price', '>', 0)
        ->firstOrFail();
}

test('deleting a commission removes both legs and the receipts left empty', function () {
    $context = createCommissionContext();
    $beneficiary = Customer::create(['name' => 'Beneficiary '.uniqid()]);

    storeCommissionFor($context, $beneficiary->id);

    $beneficiaryItem = beneficiaryCommissionItem();
    $twin = ReceiptItem::findOrFail($beneficiaryItem->commission_twin_id);

    $receiptIds = [$beneficiaryItem->receipt_id, $twin->receipt_id];

    $this->actingAs($context['user'])
        ->delete(route('receipts.items.destroy', [
            'receipt' => $beneficiaryItem->receipt_id,
            'item' => $beneficiaryItem->id,
        ]))
        ->assertRedirect();

    // Both legs are gone: the boat owner must not keep a negative commission
    // that nobody can edit any more.
    expect(ReceiptItem::where('type', 'commission')->count())->toBe(0)
        // The receipts held nothing else, so they are cleaned up too.
        ->and(Receipt::whereIn('id', $receiptIds)->count())->toBe(0);
});

test('a commission edited from the report comes back with the new values', function () {
    $context = createCommissionContext();
    $beneficiary = Customer::create(['name' => 'Beneficiary '.uniqid()]);

    storeCommissionFor($context, $beneficiary->id);

    $beneficiaryItem = beneficiaryCommissionItem();

    $this->actingAs($context['user'])
        ->put(route('receipts.items.updateCommission', [
            'receipt' => $beneficiaryItem->receipt_id,
            'item' => $beneficiaryItem->id,
        ]), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $beneficiary->id,
            'commission_per_unit' => 7,
            'unit_count' => 20,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    // The report feeds the dialog, so it must show the new values.
    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['owner']->id,
            'date' => '2026-06-01',
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->has('boat.commissions', 1)
            ->where('boat.commissions.0.commission_per_unit', 7)
            ->where('boat.commissions.0.unit_count', 20)
        );
});

test('changing the beneficiary leaves the other lines of the receipt untouched', function () {
    $context = createCommissionContext();

    $first = Customer::create(['name' => 'First '.uniqid()]);
    $second = Customer::create(['name' => 'Second '.uniqid()]);

    // The beneficiary already has a receipt for this session: the commission is
    // added to it, because both share customer, session zone and date.
    $existingReceipt = Receipt::create([
        'date' => '2026-06-01',
        'customer_id' => $first->id,
        'session_zone_id' => $context['sessionZone']->id,
        'quantity' => 0,
        'total_amount' => 0,
        'total_boxes' => 0,
    ]);

    $regularItem = $existingReceipt->items()->create([
        'item_id' => $context['item']->id,
        'unit_count' => 10,
        'real_price' => 20,
        'type' => 'item',
    ]);

    storeCommissionFor($context, $first->id);

    $commissionItem = beneficiaryCommissionItem();

    expect($commissionItem->receipt_id)->toBe($existingReceipt->id);

    $this->actingAs($context['user'])
        ->put(route('receipts.items.updateCommission', [
            'receipt' => $commissionItem->receipt_id,
            'item' => $commissionItem->id,
        ]), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $second->id,
            'commission_per_unit' => 2.5,
            'unit_count' => 10,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $commissionItem->refresh();
    $existingReceipt->refresh();

    // The commission moved to the receipt of the new beneficiary, and the
    // regular line stayed with its own customer.
    expect($commissionItem->receipt->customer_id)->toBe($second->id)
        ->and($commissionItem->receipt_id)->not->toBe($existingReceipt->id)
        ->and($regularItem->fresh()->receipt_id)->toBe($existingReceipt->id)
        ->and($existingReceipt->customer_id)->toBe($first->id)
        ->and($existingReceipt->items()->count())->toBe(1);
});

test('a company owner commission is listed in the report, updatable and deletable', function () {
    $context = createCommissionContext('2026-06-01', companyOwner: true);
    $beneficiary = Customer::create(['name' => 'Beneficiary '.uniqid()]);

    storeCommissionFor($context, $beneficiary->id);

    $item = beneficiaryCommissionItem();

    // A company cannot hold a receipt, so there is no owner line at all.
    expect(ReceiptItem::where('type', 'commission')->count())->toBe(1)
        ->and($item->commission_twin_id)->toBeNull()
        ->and($item->boat_id)->toBe($context['boat']->id);

    // The boat is stamped on the line, so the report finds it back.
    $this->actingAs($context['user'])
        ->get(route('differences.report', [
            'customer_id' => $context['client']->id,
            'date' => '2026-06-01',
            'boat_id' => $context['boat']->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('differences-show')
            ->has('boat.commissions', 1)
            ->where('boat.commissions.0.beneficiary_id', $beneficiary->id)
        );

    $this->actingAs($context['user'])
        ->put(route('receipts.items.updateCommission', [
            'receipt' => $item->receipt_id,
            'item' => $item->id,
        ]), [
            'boat_id' => $context['boat']->id,
            'beneficiary_id' => $beneficiary->id,
            'commission_per_unit' => 9,
            'unit_count' => 5,
            'session_zone_id' => $context['sessionZone']->id,
            'date' => '2026-06-01',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $item->refresh();

    expect((float) $item->real_price)->toBe(9.0)
        ->and((float) $item->unit_count)->toBe(5.0);

    $this->actingAs($context['user'])
        ->delete(route('receipts.items.destroy', [
            'receipt' => $item->receipt_id,
            'item' => $item->id,
        ]))
        ->assertRedirect();

    expect(ReceiptItem::where('type', 'commission')->count())->toBe(0)
        ->and(Receipt::where('customer_id', $beneficiary->id)->count())->toBe(0);
});
