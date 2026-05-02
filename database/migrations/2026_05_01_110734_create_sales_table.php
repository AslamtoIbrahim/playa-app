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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->date('date');

            // Relationships
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('session_id')->constrained('daily_sessions')->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users');

            /**
             * Type de Vente: 
             * - 'normal': Client 3adi (Market/Détail)
             * - 'usine': Vente à l'usine (Export/Industriel)
             */
            $table->enum('type', ['normal', 'usine'])->default('normal');

            // Financial Data
            $table->bigInteger('boxes')->default(0);
            $table->decimal('weight', 12, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Indexes for speed
            $table->index(['customer_id', 'type']);
            $table->index('session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
