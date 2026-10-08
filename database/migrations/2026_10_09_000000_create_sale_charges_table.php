<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * SaleCharges links a receipt amount to a sale (same daily session).
     * The amount is a slice of receipts.total_amount assigned to one sale.
     */
    public function up(): void
    {
        Schema::create('sale_charges', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')->constrained('sales')->restrictOnDelete();
            $table->foreignId('receipt_id')->constrained('receipts')->restrictOnDelete();

            $table->decimal('amount', 15, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['sale_id', 'receipt_id']);
            $table->index('sale_id');
            $table->index('receipt_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_charges');
    }
};
