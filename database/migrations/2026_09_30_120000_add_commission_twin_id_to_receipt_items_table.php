<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Les commissions sont rattachées au propriétaire du bateau et non à un
     * article de facture : `invoice_item_id` reste donc NULL. On ajoute un lien
     * explicite entre la jambe bénéficiaire (+) et la jambe propriétaire (-),
     * sans quoi il devient impossible de retrouver le jumeau de façon fiable.
     */
    public function up(): void
    {
        Schema::table('receipt_items', function (Blueprint $table) {
            $table->foreignId('commission_twin_id')
                ->nullable()
                ->after('type')
                ->constrained('receipt_items')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receipt_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('commission_twin_id');
        });
    }
};
