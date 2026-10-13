<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement(
                'ALTER TABLE sale_items ADD COLUMN difference_id INTEGER NULL REFERENCES differences(id) ON DELETE SET NULL'
            );

            return;
        }

        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('difference_id')
                ->nullable()
                ->constrained('differences')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('ALTER TABLE sale_items DROP COLUMN difference_id');

            return;
        }

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('difference_id');
        });
    }
};
