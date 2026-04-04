<?php

use App\Http\Controllers\AccountController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    // Route::resource('accounts', AccountController::class)->names([
    //     'index' => 'accounts',
    //     'store' => 'accounts.store',
    // ]);
    // العرض (Index)
    Route::get('accounts', [AccountController::class, 'index'])->name('accounts');
    
    // التسجيل (Store) - هادي هي المهمة للفورم
    Route::post('accounts', [AccountController::class, 'store'])->name('accounts.store');
});

require __DIR__ . '/settings.php';
