<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reception_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usine_id')->constrained('usines')->restrictOnDelete();
            $table->foreignId('session_id')->constrained('daily_sessions')->restrictOnDelete();
            $table->decimal('weight', 12, 2)->default(0);
            $table->decimal('ttc', 15, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('margin_percentage', 8, 2)->default(0);
            $table->boolean('is_invoiced')->default(false);
            $table->bigInteger('invoice_reference')->nullable();
            $table->timestamps();

            $table->index(['usine_id', 'session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reception_records');
    }
};
