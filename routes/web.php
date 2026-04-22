<?php

use App\Http\Controllers\BoatController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DailySessionController;
use App\Http\Controllers\DifferenceController;
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

    // --- Customers Routes
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->name('customers');
        Route::post('/', [CustomerController::class, 'store'])->name('customers.store');
        Route::patch('/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    });

    // --- Companies Routes
    Route::prefix('companies')->group(function () {
        Route::get('/', [CompanyController::class, 'index'])->name('companies');
        Route::post('/', [CompanyController::class, 'store'])->name('companies.store');
        Route::patch('/{company}', [CompanyController::class, 'update'])->name('companies.update');
        Route::delete('/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');
    });

    // --- Daily Sessions Routes
    Route::prefix('sessions')->group(function () {
        Route::get('/', [DailySessionController::class, 'index'])->name('sessions');
        Route::post('/', [DailySessionController::class, 'store'])->name('sessions.store');

        // التعديل (مثلا تصحيح التاريخ)
        Route::patch('/{session}', [DailySessionController::class, 'update'])->name('sessions.update');
        Route::delete('/{session}', [DailySessionController::class, 'destroy'])->name('sessions.destroy');

        // سد الحصة
        Route::patch('/{session}/close', [DailySessionController::class, 'close'])->name('sessions.close');
    });

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


    // Difference Management Routes
    Route::prefix('differences')->group(function () {
        Route::get('/', [DifferenceController::class, 'index'])->name('differences');

        Route::get('/report', [DifferenceController::class, 'showReport'])->name('differences.report'); 

        Route::post('/', [DifferenceController::class, 'store'])->name('differences.store');
        Route::patch('/{difference}', [DifferenceController::class, 'update'])->name('differences.update');
        Route::delete('/{difference}', [DifferenceController::class, 'destroy'])->name('differences.destroy');

        // Bulk & UX Actions
        Route::post('/reorder', [DifferenceController::class, 'reorder'])->name('differences.reorder');
        Route::post('/bulk-duplicate', [DifferenceController::class, 'duplicateMany'])->name('differences.duplicateMany');
        Route::delete('/bulk-delete', [DifferenceController::class, 'destroyMany'])->name('differences.destroyMany');
    });

    
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
