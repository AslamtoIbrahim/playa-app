<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `sale_items` becomes the distribution link between a purchase invoice
     * line and a sale: a sale is fed from the invoice items instead of
     * carrying its own free-form lines. The old columns (item/boat snapshot,
     * unit, box, unit_price, weight, amount, position) are therefore dropped.
     */
    public function up(): void
    {
        Schema::dropIfExists('sale_items');

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();

            // Vente cible (le client vient de la vente) et ligne de facture d'achat
            $table->foreignId('sale_id')->constrained('sales')->restrictOnDelete();
            $table->foreignId('invoice_item_id')->constrained('invoice_items')->restrictOnDelete();

            // Quantité vendue sur cette ligne et prix réel pratiqué
            $table->decimal('unit_count', 12, 2)->default(0);
            $table->decimal('real_price', 15, 2)->default(0);

            // Écart réel = (prix réel - prix unitaire facturé) * quantité
            $table->decimal('total_diff', 15, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * Restores the original free-form shape of `sale_items`.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')->constrained('sales')->restrictOnDelete();

            $table->foreignId('item_id')->nullable()->constrained('items')->restrictOnDelete();
            $table->foreignId('boat_id')->nullable()->constrained('boats')->restrictOnDelete();

            $table->string('unit')->nullable();
            $table->integer('box')->default(0);
            $table->integer('position')->default(0);

            $table->decimal('unit_count', 12, 2)->default(0);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('weight', 12, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }
};
