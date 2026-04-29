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
        Schema::create('cautions', function (Blueprint $table) {
            $table->id();

            // سمية الضمانة (مثلا: "Caution CIH", "Dépôt Cash X")
            $table->string('name');

            // هادو هما اللي غايديرو الربط مع الـ Company والـ Customer
            $table->unsignedBigInteger('owner_id');
            $table->string('owner_type');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cautions');
    }
};
