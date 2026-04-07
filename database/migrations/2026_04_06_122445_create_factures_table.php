<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique(); // مثلا: FACT-2026-001
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('amount', 15, 2); // montant (استعمل decimal للفلوس دائماً)
            $table->decimal('weight', 10, 2)->nullable(); // الوزن
            $table->string('status')->default('pending'); // حالة الفاتورة
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
