<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\BoatController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoiceItemController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\OfficeRoomController;
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


    // Invoices Routes (Direct Import Style)
    Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices');
    Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::patch('invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

    // Invoice Items (Details) Routes
    Route::post('invoices/{invoice}/items/bulk', [InvoiceItemController::class, 'bulkStore'])->name('invoices.items.bulkStore');
    Route::post('invoices/{invoice}/items/bulk-duplicate', [InvoiceItemController::class, 'duplicateMany'])->name('invoices.items.duplicateMany');
    Route::post('invoices/{invoice}/items', [InvoiceItemController::class, 'store'])->name('invoices.items.store');
    Route::patch('invoices/{invoice}/items/{item}', [InvoiceItemController::class, 'update'])->name('invoices.items.update');
    Route::post('/invoices/{invoice}/items/reorder', [InvoiceItemController::class, 'reorder'])->name('invoices.items.reorder');
    Route::delete('invoices/{invoice}/items/bulk-delete', [InvoiceItemController::class, 'destroyMany'])->name('invoices.items.destroyMany');
    Route::delete('invoices/{invoice}/items/{item}', [InvoiceItemController::class, 'destroy'])->name('invoices.items.destroy');



    // Payments Routes (Direct Import Style)
    Route::get('payments', [PaymentController::class, 'index'])->name('payments');
    Route::post('payments', [PaymentController::class, 'store'])->name('payments.store');
    Route::patch('payments/{payment}', [PaymentController::class, 'update'])->name('payments.update');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');

    // Boats Routes
    Route::get('boats', [BoatController::class, 'index'])->name('boats');
    Route::post('boats', [BoatController::class, 'store'])->name('boats.store');
    Route::patch('boats/{boat}', [BoatController::class, 'update'])->name('boats.update');
    Route::delete('boats/{boat}', [BoatController::class, 'destroy'])->name('boats.destroy');

    // Office Rooms Routes
    Route::get('office-rooms', [OfficeRoomController::class, 'index'])->name('office-rooms');
    Route::post('office-rooms', [OfficeRoomController::class, 'store'])->name('office-rooms.store');
    Route::patch('office-rooms/{officeRoom}', [OfficeRoomController::class, 'update'])->name('office-rooms.update');
    Route::delete('office-rooms/{officeRoom}', [OfficeRoomController::class, 'destroy'])->name('office-rooms.destroy');

    // Categories Routes
    Route::get('categories', [CategoryController::class, 'index'])->name('categories');
    Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::patch('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    // Items Routes
    Route::get('items', [ItemController::class, 'index'])->name('items');
    Route::post('items', [ItemController::class, 'store'])->name('items.store');
    Route::patch('items/{item}', [ItemController::class, 'update'])->name('items.update');
    Route::delete('items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');
});

require __DIR__ . '/settings.php';
