<?php

use App\Models\Category;
use App\Models\DailySession;
use App\Models\Item;
use App\Models\ReceptionRecord;
use App\Models\SaleItem;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Usine;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function createReceptionSession(string $date, string $zoneName): DailySession
{
    $session = DailySession::create([
        'session_date' => $date,
        'status' => 'open',
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    SessionZone::create([
        'daily_session_id' => $session->id,
        'zone_id' => Zone::create(['name' => $zoneName])->id,
        'total_buy' => 0,
        'total_sell' => 0,
    ]);

    return $session;
}

function createReceptionSaleCategory(
    Usine $usine,
    DailySession $session,
    string $name,
    float $amount,
): void {
    $category = Category::create(['name' => $name]);
    $item = Item::create(['name' => strtolower($name).' item', 'category_id' => $category->id]);
    $sale = $usine->sales()->create([
        'date' => $session->session_date,
        'session_id' => $session->id,
        'type' => 'usine',
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'item_id' => $item->id,
        'unit_count' => 1,
        'real_price' => $amount,
        'sale_price' => $amount,
    ]);
}

test('usine detail only displays categories from its own sales and reuses existing records', function () {
    $user = User::factory()->create();
    $usine = Usine::create(['name' => 'Usine Centrale']);
    $otherUsine = Usine::create(['name' => 'Usine Nord']);
    $emptyUsine = Usine::create(['name' => 'Usine Sans Vente']);
    $session = createReceptionSession('2026-03-01', 'Laayoune');
    $secondSession = createReceptionSession('2026-04-01', 'Tarouma');

    createReceptionSaleCategory($usine, $session, 'Poulpe', 100);
    createReceptionSaleCategory($usine, $session, 'Calamar', 200);
    createReceptionSaleCategory($usine, $secondSession, 'Seiche', 300);
    createReceptionSaleCategory($otherUsine, $session, 'Sabre', 400);

    $record = $usine->receptionRecords()->create([
        'session_id' => $session->id,
        'weight' => 100,
        'ttc' => 25,
        'amount' => 300,
        'margin_percentage' => 2.4,
    ]);
    $otherUsine->receptionRecords()->create([
        'session_id' => $session->id,
        'weight' => 10,
        'ttc' => 5,
        'amount' => 10,
        'margin_percentage' => 1,
    ]);

    $this->actingAs($user)
        ->get(route('usines.show', $usine))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('usine-show')
            ->where('usine.id', $usine->id)
            ->has('receptionRecords', 3)
            ->where('receptionRecords.0.session_date', '2026-04-01')
            ->where('receptionRecords.0.designation', 'Seiche')
            ->where('receptionRecords.1.designation', 'Calamar')
            ->where('receptionRecords.2.id', $record->id)
            ->where('receptionRecords.2.origin', 'Laayoune')
            ->where('receptionRecords.2.designation', 'Poulpe')
        );

    expect(ReceptionRecord::where('usine_id', $usine->id)->count())->toBe(3)
        ->and($record->fresh()->sale_item_id)->not->toBeNull();

    $this->actingAs($user)
        ->get(route('usines.show', $usine))
        ->assertOk();

    expect(ReceptionRecord::where('usine_id', $usine->id)->count())->toBe(3);

    $this->actingAs($user)
        ->get(route('usines.show', $otherUsine))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('receptionRecords', 1)
            ->where('receptionRecords.0.designation', 'Sabre')
        );

    $this->actingAs($user)
        ->get(route('usines.show', $emptyUsine))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('receptionRecords', 0)
        );

    expect(ReceptionRecord::where('usine_id', $emptyUsine->id)->count())->toBe(0);
});

test('reception record amounts split the session total across categories', function () {
    $user = User::factory()->create();
    $usine = Usine::create(['name' => 'Usine Montants']);
    $session = createReceptionSession('2026-05-01', 'Laayoune');

    $poulpeCategory = Category::create(['name' => 'Poulpe']);
    $calamarCategory = Category::create(['name' => 'Calamar']);
    $poulpeItem = Item::create(['name' => 'poulpe item', 'category_id' => $poulpeCategory->id]);
    $calamarItem = Item::create(['name' => 'calamar item', 'category_id' => $calamarCategory->id]);

    $sale = $usine->sales()->create([
        'date' => $session->session_date,
        'session_id' => $session->id,
        'type' => 'usine',
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'item_id' => $poulpeItem->id,
        'unit_count' => 10,
        'real_price' => 10,
        'sale_price' => 10,
        'is_with_tax' => true,
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'item_id' => $calamarItem->id,
        'unit_count' => 10,
        'real_price' => 20,
        'sale_price' => 20,
        'is_with_tax' => true,
    ]);

    $sale->forceFill(['boxes' => 3])->save();

    // 100 + 3% tax, 200 + 3% tax, plus 3 DH of box fees.
    $expectedSessionTotal = 312.0;

    $this->actingAs($user)
        ->get(route('usines.show', $usine))
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use ($expectedSessionTotal) {
            $records = collect($page->toArray()['props']['receptionRecords']);

            expect($records)->toHaveCount(2)
                ->and($records->sum(fn (array $record) => (float) $record['amount']))
                ->toEqualWithDelta($expectedSessionTotal, 0.01)
                ->and((float) $records->first()['amount'])
                ->not->toEqualWithDelta($expectedSessionTotal, 0.01);
        });
});

test('users can create update and delete reception records for an usine', function () {
    $user = User::factory()->create();
    $usine = Usine::create(['name' => 'Usine Centrale']);
    $session = createReceptionSession('2026-03-01', 'Laayoune');

    $this->actingAs($user)
        ->post(route('usines.reception-records.store', $usine), [
            'session_id' => $session->id,
            'weight' => 10,
            'ttc' => 20,
            'amount' => 30,
            'margin_percentage' => 2.4,
        ])
        ->assertRedirect();

    $record = ReceptionRecord::firstOrFail();

    expect($record->is_invoiced)->toBeFalse()
        ->and($record->usine_id)->toBe($usine->id);

    $this->actingAs($user)
        ->patch(route('usines.reception-records.update', [$usine, $record]), [
            'session_id' => $session->id,
            'weight' => 15,
            'ttc' => 25,
            'amount' => 40,
            'margin_percentage' => 3,
            'invoice_reference' => 1798,
        ])
        ->assertRedirect();

    expect($record->fresh()->amount)->toBe('40.00')
        ->and($record->fresh()->invoice_reference)->toBe(1798);

    $this->actingAs($user)
        ->delete(route('usines.reception-records.destroy', [$usine, $record]))
        ->assertRedirect();

    expect(ReceptionRecord::count())->toBe(0);
});
