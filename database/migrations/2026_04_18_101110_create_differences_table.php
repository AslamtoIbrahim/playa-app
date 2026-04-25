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

            // رجعناه Nullable لأن سلع Hortax ماعندهاش invoice_item
            $table->foreignId('invoice_item_id')->nullable()->constrained()->onDelete('cascade');

            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();

            $table->integer('unit_count');
            $table->decimal('real_price', 15, 2);
            $table->decimal('amount', 15, 2);

            // حقل الصناديق الجديد
            $table->integer('boxes')->nullable()->default(0);

            $table->decimal('total_diff', 15, 2)->default(0);
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
