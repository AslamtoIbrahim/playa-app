<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    // ... Accounts Routes
    Route::get('accounts', [AccountController::class, 'index'])->name('accounts');
    Route::post('accounts', [AccountController::class, 'store'])->name('accounts.store');
    Route::patch('accounts/{account}', [AccountController::class, 'update'])->name('accounts.update');
    Route::delete('accounts/{account}', [AccountController::class, 'destroy'])->name('accounts.destroy');

    // Factures Routes (Direct Import Style)
    Route::get('factures', [FactureController::class, 'index'])->name('factures');
    Route::post('factures', [FactureController::class, 'store'])->name('factures.store');
    Route::patch('factures/{facture}', [FactureController::class, 'update'])->name('factures.update');
    Route::delete('factures/{facture}', [FactureController::class, 'destroy'])->name('factures.destroy');

    // Payments Routes (Direct Import Style)
    Route::get('payments', [PaymentController::class, 'index'])->name('payments');
    Route::post('payments', [PaymentController::class, 'store'])->name('payments.store');
    Route::patch('payments/{payment}', [PaymentController::class, 'update'])->name('payments.update');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
});

require __DIR__ . '/settings.php';
