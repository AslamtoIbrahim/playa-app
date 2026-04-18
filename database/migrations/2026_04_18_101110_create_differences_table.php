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
        Schema::create('differences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();

            $table->integer('unit_count');       // شحال من صندوق وزعتي لهاد الكليان
            $table->decimal('real_price', 15, 2); // الثمن الجديد
            $table->decimal('amount', 15, 2);     // unit_count * real_price
            $table->decimal('total_diff', 15, 2); // الفرق المالي (real_price - original_price) * unit_count
            $table->integer('position')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('differences');
    }
};
