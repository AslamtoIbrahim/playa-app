<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A receipt may be split across multiple categories on the same sale.
     */
    public function up(): void
    {
        Schema::table('sale_charges', function (Blueprint $table) {
            $table->dropUnique('sale_charges_sale_id_receipt_id_unique');
        });
    }

    /**
     * Restore the original one-charge-per-sale/receipt constraint.
     */
    public function down(): void
    {
        Schema::table('sale_charges', function (Blueprint $table) {
            $table->unique(['sale_id', 'receipt_id']);
        });
    }
};
