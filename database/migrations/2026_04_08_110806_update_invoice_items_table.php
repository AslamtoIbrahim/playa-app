<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. إعادة تسمية الجدول من facture_items لـ invoice_items
        Schema::rename('facture_items', 'invoice_items');

        Schema::table('invoice_items', function (Blueprint $table) {
            // 2. إعادة تسمية facture_id لـ invoice_id
            $table->renameColumn('facture_id', 'invoice_id');

            // 3. مسح الحقول القديمة اللي ما بقيناش محتاجينها
            $table->dropColumn(['species', 'pu_facturation', 'pu_reel', 'diff', 'total_diff']);

            // 4. إضافة الحقول الجديدة حسب الـ ERD
            $table->foreignId('item_id')->after('invoice_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('boat_id')->nullable()->after('item_id')->constrained('boats')->onDelete('set null');
            $table->string('unit')->nullable()->after('boat_id'); // مثلا: Kg, Box
            $table->integer('unit_count')->default(0)->after('unit'); // عدد الوحدات
            $table->decimal('unit_price', 15, 2)->default(0)->after('unit_count');
            $table->decimal('amount', 15, 2)->default(0)->after('weight'); // المجموع ديال السطر
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->renameColumn('invoice_id', 'facture_id');
            $table->string('species');
            $table->dropForeign(['item_id']);
            $table->dropForeign(['boat_id']);
            $table->dropColumn(['item_id', 'boat_id', 'unit', 'unit_count', 'unit_price', 'amount']);
        });

        Schema::rename('invoice_items', 'facture_items');
    }
};