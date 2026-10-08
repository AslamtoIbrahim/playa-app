<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * SaleWorkers links an attendance wage amount to a sale (same daily session).
     * The amount is a slice of attendances.total_wage assigned to one sale.
     */
    public function up(): void
    {
        Schema::create('sale_workers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')->constrained('sales')->restrictOnDelete();
            $table->foreignId('attendance_id')->constrained('attendances')->restrictOnDelete();

            $table->decimal('amount', 15, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['sale_id', 'attendance_id']);
            $table->index('sale_id');
            $table->index('attendance_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_workers');
    }
};
