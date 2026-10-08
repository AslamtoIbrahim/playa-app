<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceItemController;
use App\Http\Controllers\BoatController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CautionController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DailySessionController;
use App\Http\Controllers\DifferenceController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoiceItemController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\OfficeRoomController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\ReceiptItemController;
use App\Http\Controllers\SaleChargeController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleItemController;
use App\Http\Controllers\SaleWorkerController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\ZoneController;
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
        // إضافة عدة عملاء دفعة وحدة
        Route::post('/bulk', [CustomerController::class, 'bulkStore'])->name('customers.bulkStore');
        Route::patch('/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    });

    // --- Companies Routes
    Route::prefix('companies')->group(function () {
        Route::get('/', [CompanyController::class, 'index'])->name('companies');
        Route::post('/', [CompanyController::class, 'store'])->name('companies.store');
        // إضافة عدة شركات دفعة وحدة
        Route::post('/bulk', [CompanyController::class, 'bulkStore'])->name('companies.bulkStore');
        Route::patch('/{company}', [CompanyController::class, 'update'])->name('companies.update');
        Route::delete('/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');
    });

    // --- Daily Sessions Routes
    Route::prefix('sessions')->group(function () {
        Route::get('/', [DailySessionController::class, 'index'])->name('sessions');
        Route::post('/', [DailySessionController::class, 'store'])->name('sessions.store');

        Route::get('/{session}', [DailySessionController::class, 'show'])->name('sessions.show');
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
    Route::post('invoices/{invoice}/sell', [InvoiceController::class, 'sell'])->name('invoices.sell');
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
    // Ajout de plusieurs bateaux d'un coup (avec leurs propriétaires)
    Route::post('boats/bulk', [BoatController::class, 'bulkStore'])->name('boats.bulkStore');

    Route::delete('boats/{boat}', [BoatController::class, 'destroy'])->name('boats.destroy');

    // Cautions Routes
    Route::get('cautions', [CautionController::class, 'index'])->name('cautions');
    Route::post('cautions', [CautionController::class, 'store'])->name('cautions.store');
    // Ajouter plusieurs cautions d'un coup
    Route::post('cautions/bulk', [CautionController::class, 'bulkStore'])->name('cautions.bulkStore');
    Route::patch('cautions/{caution}', [CautionController::class, 'update'])->name('cautions.update');
    Route::delete('cautions/{caution}', [CautionController::class, 'destroy'])->name('cautions.destroy');

    // Office Rooms Routes
    Route::get('office-rooms', [OfficeRoomController::class, 'index'])->name('office-rooms');
    Route::post('office-rooms', [OfficeRoomController::class, 'store'])->name('office-rooms.store');
    Route::patch('office-rooms/{officeRoom}', [OfficeRoomController::class, 'update'])->name('office-rooms.update');
    Route::delete('office-rooms/{officeRoom}', [OfficeRoomController::class, 'destroy'])->name('office-rooms.destroy');

    // Categories Routes
    Route::get('categories', [CategoryController::class, 'index'])->name('categories');
    Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
    // Ajout de plusieurs catégories d'un coup
    Route::post('categories/bulk', [CategoryController::class, 'bulkStore'])->name('categories.bulkStore');
    Route::patch('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    // Items Routes
    Route::get('items', [ItemController::class, 'index'])->name('items');
    Route::post('items', [ItemController::class, 'store'])->name('items.store');
    // Ajout de plusieurs articles d'un coup (avec leurs catégories)
    Route::post('items/bulk', [ItemController::class, 'bulkStore'])->name('items.bulkStore');
    Route::patch('items/{item}', [ItemController::class, 'update'])->name('items.update');
    Route::delete('items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');

    // --- Receipts Routes
    Route::get('receipts', [ReceiptController::class, 'index'])->name('receipts');
    Route::post('receipts', [ReceiptController::class, 'store'])->name('receipts.store');
    Route::get('receipts/{receipt}', [ReceiptController::class, 'show'])->name('receipts.show');
    Route::patch('receipts/{receipt}', [ReceiptController::class, 'update'])->name('receipts.update');
    Route::delete('receipts/{receipt}', [ReceiptController::class, 'destroy'])->name('receipts.destroy');

    // import { store, update } from '@/routes/receipts/items';
    // --- Receipt Items (Details) Routes
    Route::prefix('receipts')->group(function () {

        // 1. هادي حطها هنا (خارج الـ ID ديال بون محدد)
        // حيت هي اللي غاتكلف بالبحث عن الـ Receipts ديال المستفيد ومول الباطو
        Route::post('/items/commission', [ReceiptItemController::class, 'storeCommission'])
            ->name('receipts.items.storeCommission');

        // 2. الـ Routes اللي كيحتاجو Receipt محدد ديجا
        Route::prefix('{receipt}/items')->group(function () {

            // --- Commission Update Route ---
            // katsift liha id dyal l-receipt o id dyal l-item (beneficiary row)
            Route::put('/{item}/commission', [ReceiptItemController::class, 'updateCommission'])
                ->name('receipts.items.updateCommission');

            Route::post('/bulk', [ReceiptItemController::class, 'bulkStore'])->name('receipts.items.bulkStore');
            Route::post('/reorder', [ReceiptItemController::class, 'reorder'])->name('receipts.items.reorder');
            Route::post('/bulk-duplicate', [ReceiptItemController::class, 'duplicateMany'])->name('receipts.items.duplicateMany');
            Route::delete('/bulk-delete', [ReceiptItemController::class, 'destroyMany'])->name('receipts.items.destroyMany');

            Route::post('/', [ReceiptItemController::class, 'store'])->name('receipts.items.store');
            Route::patch('/{item}', [ReceiptItemController::class, 'update'])->name('receipts.items.update');
            Route::delete('/{item}', [ReceiptItemController::class, 'destroy'])->name('receipts.items.destroy');
        });
    });

    // --- Sales Routes (Header) ---
    Route::get('sales', [SaleController::class, 'index'])->name('sales');
    Route::post('sales', [SaleController::class, 'store'])->name('sales.store');
    Route::get('sales/{sale}', [SaleController::class, 'show'])->name('sales.show');
    Route::patch('sales/{sale}', [SaleController::class, 'update'])->name('sales.update');
    Route::delete('sales/{sale}', [SaleController::class, 'destroy'])->name('sales.destroy');

    // --- Sale Items (Distribution d'une ligne de facture vers une vente) ---
    Route::post('sale-items', [SaleItemController::class, 'store'])->name('sale-items.store');
    Route::patch('sale-items/{saleItem}', [SaleItemController::class, 'update'])->name('sale-items.update');
    Route::delete('sale-items/{saleItem}', [SaleItemController::class, 'destroy'])->name('sale-items.destroy');

    // --- Sale Charges (Imputation d'un bon de réception vers une vente) ---
    Route::post('sale-charges', [SaleChargeController::class, 'store'])->name('sale-charges.store');
    Route::patch('sale-charges/{saleCharge}', [SaleChargeController::class, 'update'])->name('sale-charges.update');
    Route::delete('sale-charges/{saleCharge}', [SaleChargeController::class, 'destroy'])->name('sale-charges.destroy');

    // --- Sale Workers (Imputation d'une part de masse salariale vers une vente) ---
    Route::post('sale-workers', [SaleWorkerController::class, 'store'])->name('sale-workers.store');
    Route::patch('sale-workers/{saleWorker}', [SaleWorkerController::class, 'update'])->name('sale-workers.update');
    Route::delete('sale-workers/{saleWorker}', [SaleWorkerController::class, 'destroy'])->name('sale-workers.destroy');

    // --- Workers Routes ---
    Route::get('workers', [WorkerController::class, 'index'])->name('workers');
    Route::post('workers', [WorkerController::class, 'store'])->name('workers.store');
    // Ajout de plusieurs ouvriers d'un coup
    Route::post('workers/bulk', [WorkerController::class, 'bulkStore'])->name('workers.bulkStore');
    Route::patch('workers/{worker}', [WorkerController::class, 'update'])->name('workers.update');
    Route::delete('workers/{worker}', [WorkerController::class, 'destroy'])->name('workers.destroy');

    // --- Attendances Routes (Header) ---
    Route::get('attendances', [AttendanceController::class, 'index'])->name('attendances');
    Route::post('attendances', [AttendanceController::class, 'store'])->name('attendances.store');
    Route::patch('attendances/{attendance}', [AttendanceController::class, 'update'])->name('attendances.update');
    Route::get('attendances/{attendance}', [AttendanceController::class, 'show'])->name('attendances.show');
    Route::delete('attendances/{attendance}', [AttendanceController::class, 'destroy'])->name('attendances.destroy');

    // --- Attendance Items Routes (Details) ---
    Route::prefix('attendances/{attendance}/items')->group(function () {
        // Bulk Operations
        Route::post('bulk', [AttendanceItemController::class, 'bulkStore'])->name('attendances.items.bulkStore');
        Route::delete('bulk', [AttendanceItemController::class, 'bulkDestroy'])->name('attendances.items.bulkDestroy');
        // Single Store
        Route::post('/', [AttendanceItemController::class, 'store'])->name('attendances.items.store');

    });
    // Individual Item Operations
    Route::patch('attendance-items/{item}', [AttendanceItemController::class, 'update'])->name('attendances.items.update');
    Route::delete('attendance-items/{item}', [AttendanceItemController::class, 'destroy'])->name('attendances.items.destroy');

    // --- Zones Routes ---
    Route::prefix('zones')->group(function () {
        Route::get('/', [ZoneController::class, 'index'])->name('zones');
        Route::post('/', [ZoneController::class, 'store'])->name('zones.store');
        Route::patch('/{zone}', [ZoneController::class, 'update'])->name('zones.update');
        Route::delete('/{zone}', [ZoneController::class, 'destroy'])->name('zones.destroy');
        Route::get('/{zone}', [ZoneController::class, 'show'])->name('zones.show');

    });
});

require __DIR__.'/settings.php';
