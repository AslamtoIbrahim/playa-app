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
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            // الارتباط بالفاتورة الأم
            $table->foreignId('invoice_id')->constrained('invoices')->restrictOnDelete();

            // الارتباط بالسلعة والباطو (nullable حيت بعض المرات كيكون غير سطور عادية)
            $table->foreignId('item_id')->nullable()->constrained('items')->restrictOnDelete();
            $table->foreignId('boat_id')->nullable()->constrained('boats')->restrictOnDelete();

            $table->string('unit')->nullable();           // مثلا: صندوق، كيلو، وحدة
            $table->integer('box')->default(0);
            $table->integer('position')->default(0);
            $table->integer('unit_count')->default(0);    // عدد الوحدات (مثلا 10 صنادق)
            $table->decimal('unit_price', 15, 2)->default(0); // ثمن الوحدة
            $table->decimal('weight', 10, 2)->default(0);     // الوزن ديال هاد السطر
            $table->decimal('amount', 15, 2)->default(0);     // المجموع (count * price)

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
