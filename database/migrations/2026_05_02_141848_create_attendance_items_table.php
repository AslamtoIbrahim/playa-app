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
        Schema::create('attendance_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('attendance_id')
                ->constrained()
                ->cascadeOnDelete(); // إذا تمسح الـ Header يتمسحو الـ Items

            $table->foreignId('worker_id')
                ->constrained()
                ->restrictOnDelete(); // ممنوع تمسح خدام وهو ديجا مقيد ف الحضور

            $table->decimal('wage', 15, 2);

            $table->timestamps();

            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_items');
    }
};
