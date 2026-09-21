<?php

use App\Models\Caution;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\OfficeRoom;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('la caution peut être retirée lors de la modification depuis la journée', function () {
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

    $customer = Customer::create(['name' => 'Client Test']);
    $officeRoom = OfficeRoom::create(['name' => 'Bureau Test', 'city' => 'casablanca']);

    $caution = Caution::create([
        'name' => 'CIH',
        'owner_id' => $customer->id,
        'owner_type' => Customer::class,
    ]);

    $invoice = Invoice::create([
        'date' => now()->toDateString(),
        'invoice_number' => 202600001,
        'type' => 'purchase',
        'billable_id' => $customer->id,
        'billable_type' => Customer::class,
        'caution_id' => $caution->id,
        'session_zone_id' => $sessionZone->id,
        'office_room_id' => $officeRoom->id,
        'amount' => 0,
        'boxes' => 0,
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('sessions.show', $session->id))
        ->patch(route('invoices.update', $invoice->id), [
            'date' => $invoice->date,
            'billable_id' => $customer->id,
            'billable_type' => Customer::class,
            'office_room_id' => $officeRoom->id,
            'session_zone_id' => $sessionZone->id,
            // Le dialogue envoie une chaîne vide quand aucune caution n'est choisie.
            'caution_id' => '',
            'status' => $invoice->status,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('sessions.show', $session->id));

    expect($invoice->fresh()->caution_id)->toBeNull();
});
