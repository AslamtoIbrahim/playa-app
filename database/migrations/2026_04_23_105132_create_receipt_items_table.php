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
        Schema::create('receipt_items', function (Blueprint $table) {
            $table->id();

            // العلاقات
            $table->foreignId('receipt_id')->constrained()->onDelete('cascade');
            $table->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete();

            // الحقول حسب الصورة
            $table->decimal('unit_count', 15, 2);
            $table->decimal('real_price', 15, 2);
            $table->bigInteger('box')->nullable()->default(0); // Field jdid m-zayd hna
            $table->decimal('total_diff', 15, 2);

            $table->integer('position')->default(0)->index();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipt_items');
    }
};
