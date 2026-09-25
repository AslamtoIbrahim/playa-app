<?php

// Script de vérification temporaire : payload réel de la fiche d'une zone.
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$controller = app(App\Http\Controllers\ZoneController::class);

foreach (App\Models\Zone::all() as $zone) {
    // Requête Inertia simulée : la réponse est alors un payload JSON.
    $request = Illuminate\Http\Request::create(
        '/zones/'.$zone->id,
        'GET',
        [],
        [],
        [],
        ['HTTP_X_INERTIA' => 'true']
    );

    $props = $controller->show($zone)->toResponse($request)->getData(true)['props'];

    dump([
        'zone' => $zone->name,
        'rows' => array_map(fn ($row) => [
            'session' => $row['id'],
            'date' => (string) $row['session_date'],
            'status' => $row['status'],
            'total_buy' => $row['total_buy'],
            'total_sell' => $row['total_sell'],
            'marge' => round((float) $row['total_sell'] - (float) $row['total_buy'], 2),
        ], $props['dailySessions']),
    ]);
}
