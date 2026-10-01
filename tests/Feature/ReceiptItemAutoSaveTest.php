<?php

use App\Models\Boat;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Item;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Les pages Inertia rendent app.blade.php : on évite la dépendance au manifest Vite.
    $this->withoutVite();
});

/**
 * Contexte minimal d'un bon avec une ligne : c'est la ligne que la grille
 * édite et enregistre automatiquement.
 */
function createReceiptAutoSaveContext(string $date = '2026-06-01'): array
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

    $receipt = Receipt::create([
        'date' => $date,
        'customer_id' => $client->id,
        'boat_id' => $boat->id,
        'session_zone_id' => $sessionZone->id,
    ]);

    $receiptItem = ReceiptItem::create([
        'receipt_id' => $receipt->id,
        'item_id' => $item->id,
        'boat_id' => $boat->id,
        'unit_count' => 10,
        'real_price' => 20,
        'box' => 10,
        'type' => 'item',
        'position' => 0,
    ]);

    $receipt->calculateTotals();

    return [
        'user' => $user,
        'client' => $client,
        'boat' => $boat,
        'item' => $item,
        'receipt' => $receipt,
        'receiptItem' => $receiptItem,
    ];
}

/**
 * La grille enregistre chaque modification sans attendre la touche Entrée :
 * le PATCH doit donc persister le contenu exact de la ligne.
 */
test('une modification de cellule est enregistrée sans attendre la touche entrée', function () {
    $context = createReceiptAutoSaveContext();

    $this->actingAs($context['user'])
        ->patch(route('receipts.items.update', [
            'receipt' => $context['receipt']->id,
            'item' => $context['receiptItem']->id,
        ]), [
            'item_id' => $context['item']->id,
            'unit_count' => 14,
            'real_price' => 22.5,
            'box' => 14,
            '_method' => 'PATCH',
        ])
        ->assertSessionHasNoErrors();

    $item = $context['receiptItem']->fresh();

    expect((float) $item->unit_count)->toBe(14.0)
        ->and((float) $item->real_price)->toBe(22.5)
        ->and((int) $item->box)->toBe(14)
        ->and((float) $item->total_diff)->toBe(315.0);

    // Les totaux du bon suivent, sans rechargement manuel.
    $receipt = $context['receipt']->fresh();

    expect((float) $receipt->quantity)->toBe(14.0)
        ->and((float) $receipt->total_amount)->toBe(315.0)
        ->and((float) $receipt->total_boxes)->toBe(14.0);
});

/**
 * Une cellule vidée part en chaîne vide lors de l'enregistrement automatique :
 * la valeur déjà enregistrée ne doit pas être remise à zéro.
 */
test('une cellule vidée conserve la valeur déjà enregistrée', function () {
    $context = createReceiptAutoSaveContext();

    $this->actingAs($context['user'])
        ->patch(route('receipts.items.update', [
            'receipt' => $context['receipt']->id,
            'item' => $context['receiptItem']->id,
        ]), [
            'item_id' => $context['item']->id,
            'unit_count' => '',
            'real_price' => '',
            'box' => '',
            '_method' => 'PATCH',
        ])
        ->assertSessionHasNoErrors();

    $item = $context['receiptItem']->fresh();

    expect((float) $item->unit_count)->toBe(10.0)
        ->and((float) $item->real_price)->toBe(20.0)
        ->and((int) $item->box)->toBe(10);
});
