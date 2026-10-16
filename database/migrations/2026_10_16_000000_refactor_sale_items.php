<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['difference_id']);
            $table->dropColumn('difference_id');
            $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('boat_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('sale_price', 15, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->boolean('is_with_tax')->default(false);
            $table->foreignId('invoice_item_id')->nullable()->change();
        });

        DB::table('sale_items')->orderBy('id')->get()->each(function ($saleItem) {
            $invoicePrice = $saleItem->invoice_item_id
                ? DB::table('invoice_items')->where('id', $saleItem->invoice_item_id)->value('unit_price')
                : null;
            DB::table('sale_items')->where('id', $saleItem->id)->update([
                'sale_price' => $invoicePrice ?? $saleItem->real_price,
                'amount' => (float) $saleItem->unit_count * (float) $saleItem->real_price,
                'tax' => 0,
                'total_diff' => ((float) ($invoicePrice ?? $saleItem->real_price) - (float) $saleItem->real_price) * (float) $saleItem->unit_count,
                'item_id' => $saleItem->invoice_item_id
                    ? DB::table('invoice_items')->where('id', $saleItem->invoice_item_id)->value('item_id')
                    : null,
                'boat_id' => $saleItem->invoice_item_id
                    ? DB::table('invoice_items')->where('id', $saleItem->invoice_item_id)->value('boat_id')
                    : null,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
            $table->dropForeign(['boat_id']);
            $table->dropColumn(['item_id', 'boat_id', 'sale_price', 'amount', 'tax', 'is_with_tax']);
            $table->foreignId('difference_id')->nullable()->constrained('differences')->nullOnDelete();
            $table->foreignId('invoice_item_id')->nullable(false)->change();
        });
    }
};
