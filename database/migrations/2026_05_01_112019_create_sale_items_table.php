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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();

            // الارتباط بالعملية الأم (Sale) مع منع الحذف إذا كانت هناك عناصر
            $table->foreignId('sale_id')->constrained('sales')->restrictOnDelete();

            // الارتباط بالسلعة والباطو (Mnin jaya l-sel3a)
            $table->foreignId('item_id')->nullable()->constrained('items')->restrictOnDelete();
            $table->foreignId('boat_id')->nullable()->constrained('boats')->restrictOnDelete();

            // التفاصيل الكمية والمالية
            $table->string('unit')->nullable();           // مثلا: kg, box, piece
            $table->integer('box')->default(0);            // عدد الصناديق الفعلي
            $table->integer('position')->default(0);       // ترتيب السطر في القائمة

            $table->decimal('unit_count', 12, 2)->default(0);     // الكمية (مثلا 25.5 كيلو أو 10 صنادق)
            $table->decimal('unit_price', 15, 2)->default(0);    // ثمن الوحدة
            $table->decimal('weight', 12, 2)->default(0);        // الوزن الإجمالي لهذا السطر
            $table->decimal('amount', 15, 2)->default(0);        // المجموع (unit_count * unit_price)

            $table->timestamps();
            $table->softDeletes(); // للأرشفة والحماية من الحذف النهائي
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
