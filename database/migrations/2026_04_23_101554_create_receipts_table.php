<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            
            $table->date('date');
            
            // الربط مع الكليان والجلسة اليومية
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('session_id')->constrained('daily_sessions')->restrictOnDelete();

            $table->foreignId('boat_id')->nullable()->constrained('boats')->nullOnDelete();

            $table->decimal('quantity', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->bigInteger('total_boxes')->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};