<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('invoice_id')->constrained()->restrictOnDelete();
        });

        DB::table('invoice_items')
            ->join('items', 'invoice_items.item_id', '=', 'items.id')
            ->select('invoice_items.id', 'items.category_id')
            ->orderBy('invoice_items.id')
            ->get()
            ->each(fn ($row) => DB::table('invoice_items')->where('id', $row->id)->update(['category_id' => $row->category_id]));

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('item_id');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->foreignId('item_id')->nullable()->constrained()->restrictOnDelete();
        });

        DB::table('invoice_items')
            ->join('items', 'invoice_items.category_id', '=', 'items.category_id')
            ->select('invoice_items.id', 'items.id as item_id')
            ->orderBy('invoice_items.id')
            ->get()
            ->each(fn ($row) => DB::table('invoice_items')->where('id', $row->id)->update(['item_id' => $row->item_id]));

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });
    }
};
