<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A reception record may now represent a category coming from a receipt
     * charge instead of a sale item. The category is stored explicitly so the
     * usine detail can keep displaying it after the request.
     */
    public function up(): void
    {
        Schema::table('reception_records', function (Blueprint $table) {
            $table->foreignId('category_id')
                ->nullable()
                ->after('sale_item_id')
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
        Schema::table('reception_records', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });
    }
};
