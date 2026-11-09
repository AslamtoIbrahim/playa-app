<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reception_records', function (Blueprint $table) {
            $table->unsignedBigInteger('sale_item_id')->nullable()->after('session_id');
            $table->index(['usine_id', 'session_id', 'sale_item_id']);
        });
    }

    public function down(): void
    {
        Schema::table('reception_records', function (Blueprint $table) {
            $table->dropIndex(['usine_id', 'session_id', 'sale_item_id']);
            $table->dropColumn('sale_item_id');
        });
    }
};
