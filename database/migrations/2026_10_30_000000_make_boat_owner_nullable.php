<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boats', function (Blueprint $table) {
            $table->unsignedBigInteger('owner_id')->nullable()->change();
            $table->string('owner_type')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('boats', function (Blueprint $table) {
            $table->unsignedBigInteger('owner_id')->nullable(false)->change();
            $table->string('owner_type')->nullable(false)->change();
        });
    }
};
