<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_zones', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('daily_session_id')
                  ->constrained('daily_sessions')
                  ->restrictOnDelete();

            $table->foreignId('zone_id')
                  ->constrained('zones')
                  ->restrictOnDelete();

            $table->decimal('total_buy', 15, 2)->default(0);
            $table->decimal('total_sell', 15, 2)->default(0);

            $table->softDeletes();  
            $table->timestamps();

            $table->unique(['daily_session_id', 'zone_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_zones');
    }
};