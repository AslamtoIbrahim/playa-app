<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            // مربوطة مع الجلسة اليومية via SessionZone
            $table->foreignId('session_zone_id') // Changed from daily_session_id
                ->constrained('session_zones') // Constrained to session_zones
                ->restrictOnDelete();

            $table->decimal('total_wage', 15, 2)->default(0);

            $table->timestamps();

            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
