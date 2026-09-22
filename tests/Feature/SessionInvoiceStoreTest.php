<?php

use App\Models\Customer;
use App\Models\DailySession;
use App\Models\Invoice;
use App\Models\OfficeRoom;
use App\Models\Receipt;
use App\Models\SessionZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Prépare une journée (avec sa zone), un client et un bureau : tout ce qu'il
 * faut pour créer une facture depuis la page d'une journée.
 */
function prepareInvoiceContext(string $status = 'open'): array
{
    $zone = Zone::create(['name' => 'laayoune']);

    $session = DailySession::create([
        'session_date' => now()->startOfDay(),
        'status' => $status,
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

    return compact('session', 'sessionZone', 'customer', 'officeRoom');
}

/**
 * Payload envoyé par le dialogue quand la session, la zone et la date sont
 * déjà connues (champs cachés du formulaire).
 */
function lockedInvoicePayload(array $context, array $overrides = []): array
{
    return array_merge([
        'date' => $context['session']->session_date->toDateString(),
        'type' => 'purchase',
        'billable_id' => $context['customer']->id,
        'billable_type' => Customer::class,
        'session_zone_id' => $context['sessionZone']->id,
        'office_room_id' => $context['officeRoom']->id,
        'caution_id' => '',
        'redirect_to' => 'session',
    ], $overrides);
}

test('une facture est créée depuis la journée et renvoie sur la journée', function () {
    $context = prepareInvoiceContext();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('invoices.store'), lockedInvoicePayload($context))
        ->assertRedirect(route('sessions.show', $context['session']->id));

    $invoice = Invoice::firstOrFail();

    expect($invoice->type)->toBe('purchase')
        ->and($invoice->session_zone_id)->toBe($context['sessionZone']->id)
        ->and($invoice->office_room_id)->toBe($context['officeRoom']->id)
        // Le champ caution reste optionnel : le client peut ne pas en avoir.
        ->and($invoice->caution_id)->toBeNull()
        ->and($invoice->created_by)->toBe($user->id)
        ->and($invoice->invoice_number)->toBe((int) (now()->year.'00001'));
});

test('une facture de vente reprend le type du contexte', function () {
    $context = prepareInvoiceContext();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('invoices.store'), lockedInvoicePayload($context, ['type' => 'sale']))
        ->assertRedirect(route('sessions.show', $context['session']->id));

    expect(Invoice::firstOrFail()->type)->toBe('sale');
});

test('sans contexte journée, la redirection reste la fiche facture', function () {
    $context = prepareInvoiceContext();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('invoices.store'), lockedInvoicePayload($context, ['redirect_to' => null]))
        ->assertRedirect(route('invoices.show', Invoice::firstOrFail()->id));
});

test('la création est refusée quand la journée est clôturée', function () {
    $context = prepareInvoiceContext('closed');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('sessions.show', $context['session']->id))
        ->post(route('invoices.store'), lockedInvoicePayload($context))
        ->assertSessionHasErrors('session_zone_id');

    expect(Invoice::count())->toBe(0);
});

test('un bon de réception est créé depuis la journée et renvoie sur la journée', function () {
    $context = prepareInvoiceContext();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('receipts.store'), [
            'date' => $context['session']->session_date->toDateString(),
            'customer_id' => $context['customer']->id,
            'session_zone_id' => $context['sessionZone']->id,
            'boat_id' => '',
            'redirect_to' => 'session',
        ])
        ->assertRedirect(route('sessions.show', $context['session']->id));

    $receipt = Receipt::firstOrFail();

    expect($receipt->session_zone_id)->toBe($context['sessionZone']->id)
        ->and($receipt->customer_id)->toBe($context['customer']->id)
        ->and($receipt->boat_id)->toBeNull()
        ->and($receipt->total_amount)->toBe(0);
});

test('sans contexte journée, un bon renvoie vers sa fiche', function () {
    $context = prepareInvoiceContext();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('receipts.store'), [
            'date' => $context['session']->session_date->toDateString(),
            'customer_id' => $context['customer']->id,
            'session_zone_id' => $context['sessionZone']->id,
            'boat_id' => '',
        ])
        ->assertRedirect(route('receipts.show', Receipt::firstOrFail()->id));
});
