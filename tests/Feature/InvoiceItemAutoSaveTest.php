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
 * Contexte minimal d'une facture avec un svelte : c'est la ligne que la grille
 * édite et enregistre automatiquement.
 */
function createAutoSaveContext(string $date = '2026-06-01'): array
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

    $invoice->calculateTotals();

    return [
        'user' => $user,
        'client' => $client,
        'boat' => $boat,
        'item' => $item,
        'invoice' => $invoice,
        'invoiceItem' => $invoiceItem,
    ];
}

/** Ajoute une répartition au svelte, avec l'écart correspondant. */
function createDifferenceFor(array $context, float $unitCount, float $realPrice): Difference
{
    return Difference::create([
        'invoice_item_id' => $context['invoiceItem']->id,
        'customer_id' => $context['client']->id,
        'item_id' => $context['item']->id,
        'unit_count' => $unitCount,
        'real_price' => $realPrice,
        'amount' => $unitCount * $realPrice,
        'total_diff' => ($realPrice - 20) * $unitCount,
        'boxes' => 0,
        'position' => 0,
    ]);
}

/**
 * La grille enregistre chaque modification sans attendre la touche Entrée :
 * le PATCH doit donc persister le contenu exact de la ligne.
 */
test('une modification de cellule est enregistrée sans attendre la touche entrée', function () {
    $context = createAutoSaveContext();

    $this->actingAs($context['user'])
        ->patch(route('invoices.items.update', [
            'invoice' => $context['invoice']->id,
            'item' => $context['invoiceItem']->id,
        ]), [
            'boat_id' => $context['boat']->id,
            'item_id' => $context['item']->id,
            'unit_count' => 14,
            'unit_price' => 22.5,
            'unit' => 'caisse',
            'box' => 14,
            'weight' => 294,
            '_method' => 'PATCH',
        ])
        ->assertSessionHasNoErrors();

    $item = $context['invoiceItem']->fresh();

    expect((float) $item->unit_count)->toBe(14.0)
        ->and((float) $item->unit_price)->toBe(22.5)
        ->and((int) $item->box)->toBe(14)
        ->and((float) $item->weight)->toBe(294.0)
        ->and((float) $item->amount)->toBe(315.0);

    // Les totaux de la facture suivent, sans rechargement manuel.
    $invoice = $context['invoice']->fresh();

    expect((float) $invoice->boxes)->toBe(14.0)
        ->and((float) $invoice->weight)->toBe(294.0);
});

/**
 * Une cellule vidée part en chaîne vide lors de l'enregistrement automatique :
 * la valeur déjà enregistrée ne doit pas être remise à zéro.
 */
test('une cellule vidée conserve la valeur déjà enregistrée', function () {
    $context = createAutoSaveContext();

    $this->actingAs($context['user'])
        ->patch(route('invoices.items.update', [
            'invoice' => $context['invoice']->id,
            'item' => $context['invoiceItem']->id,
        ]), [
            'boat_id' => $context['boat']->id,
            'item_id' => $context['item']->id,
            'unit_count' => '',
            'unit_price' => '',
            'unit' => 'caisse',
            'box' => '',
            'weight' => '',
            '_method' => 'PATCH',
        ])
        ->assertSessionHasNoErrors();

    $item = $context['invoiceItem']->fresh();

    expect((float) $item->unit_count)->toBe(10.0)
        ->and((float) $item->unit_price)->toBe(20.0)
        ->and((int) $item->box)->toBe(10);
});

/**
 * La colonne « Différence » lit `differences.total_diff` : un changement de prix
 * enregistré automatiquement doit donc recomputer les écarts, sinon la cellule
 * afficherait un total périmé juste après la frappe.
 */
test('un prix modifié recalcule le total des différences de la ligne', function () {
    $context = createAutoSaveContext();

    createDifferenceFor($context, 10, 25);

    $this->actingAs($context['user'])
        ->patch(route('invoices.items.update', [
            'invoice' => $context['invoice']->id,
            'item' => $context['invoiceItem']->id,
        ]), [
            'boat_id' => $context['boat']->id,
            'item_id' => $context['item']->id,
            'unit_count' => 10,
            'unit_price' => 30,
            'unit' => 'caisse',
            'box' => 10,
            'weight' => 210,
            '_method' => 'PATCH',
        ])
        ->assertSessionHasNoErrors();

    // (30 - 25) * 10 = -50 : l'écart s'inverse quand le prix de la facture monte.
    expect((float) Difference::first()->total_diff)->toBe(-50.0);
});

/**
 * La cellule et le DifferenceDialog lisent tous deux `differences` et
 * `receipt_items` : la page doit donc les exposer sur chaque svelte.
 */
test('la facture expose les différences et les commissions de chaque svelte', function () {
    $context = createAutoSaveContext();

    $difference = createDifferenceFor($context, 10, 25);

    $receipt = Receipt::create([
        'date' => '2026-06-01',
        'customer_id' => $context['client']->id,
        'boat_id' => $context['boat']->id,
        'session_zone_id' => $context['invoice']->session_zone_id,
    ]);

    $commission = ReceiptItem::create([
        'receipt_id' => $receipt->id,
        'item_id' => $context['item']->id,
        'invoice_item_id' => $context['invoiceItem']->id,
        'boat_id' => $context['boat']->id,
        'unit_count' => 10,
        'real_price' => 2,
        'box' => 0,
        'type' => 'commission',
    ]);

    $this->actingAs($context['user'])
        ->get(route('invoices.show', $context['invoice']->id))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoice-show')
            ->has('invoice.items', 1)
            ->where('invoice.items.0.id', $context['invoiceItem']->id)
            ->has('invoice.items.0.differences', 1)
            ->where('invoice.items.0.differences.0.id', $difference->id)
            ->where('invoice.items.0.differences.0.total_diff', 50)
            ->has('invoice.items.0.receipt_items', 1)
            ->where('invoice.items.0.receipt_items.0.id', $commission->id)
            ->where('invoice.items.0.receipt_items.0.type', 'commission')
        );
});
