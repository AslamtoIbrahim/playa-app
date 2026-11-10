<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * A sale charge may carry a manual category. When it is null, the category
     * is inferred from the receipt items (or distributed across the usine
     * categories by the reporting layer).
     */
    public function up(): void
    {
        Schema::table('sale_charges', function (Blueprint $table) {
            $table->foreignId('category_id')
                ->nullable()
                ->index()
                ->constrained('categories')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_charges', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });
    }
};
