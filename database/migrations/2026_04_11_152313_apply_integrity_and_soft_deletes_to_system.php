<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. إضافة Soft Deletes للجداول الأساسية باش البيانات ما تمسحش نهائياً
        foreach (['accounts', 'boats', 'office_rooms', 'categories', 'items', 'invoices'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                if (!Schema::hasColumn($table->getTable(), 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // 2. تحديث الـ Foreign Keys في جدول Invoices
        Schema::table('invoices', function (Blueprint $table) {
            // حماية علاقة الحساب: ممنوع مسح الحساب إذا كانت عنده فواتير
            $table->dropForeign(['account_id']);
            $table->foreignId('account_id')->change()->constrained()->restrictOnDelete();

            // حماية علاقة المكتب: ممنوع مسح المكتب إذا كانت فيه فواتير
            $table->dropForeign(['office_room_id']);
            $table->foreignId('office_room_id')->change()->constrained('office_rooms')->restrictOnDelete();
        });

        // 3. تحديث الـ Foreign Keys في جدول Invoice Items (تفاصيل الفاتورة)
        Schema::table('invoice_items', function (Blueprint $table) {
            // حماية الفاتورة: ممنوع تمسح فاتورة وهي باقية عامرة بأسطر السلع
            $table->dropForeign(['invoice_id']);
            $table->foreignId('invoice_id')->change()->constrained()->restrictOnDelete();

            // حماية السلعة: ممنوع تمسح سلعة (Item) وهي مسجلة فشي فاتورة
            $table->dropForeign(['item_id']);
            $table->foreignId('item_id')->change()->constrained('items')->restrictOnDelete();

            // حماية المركب: ممنوع تمسح مركب وهو مرتبط بأسطر فواتير
            if (Schema::hasColumn('invoice_items', 'boat_id')) {
                $table->dropForeign(['boat_id']);
                $table->foreignId('boat_id')->change()->constrained('boats')->restrictOnDelete();
            }
        });

        // 4. تحديث Boats (علاقة المركب بالحساب)
        Schema::table('boats', function (Blueprint $table) {
            // ممنوع مسح الحساب إذا كان باقي عنده مراكب مسجلين باسمه
            $table->dropForeign(['account_id']);
            $table->foreignId('account_id')->change()->constrained()->restrictOnDelete();
        });

        // 5. تحديث Items (علاقة السلعة بالصنف)
        Schema::table('items', function (Blueprint $table) {
            // ممنوع مسح الصنف (Category) إذا كان باقي فيه سلع (Items)
            $table->dropForeign(['category_id']);
            $table->foreignId('category_id')->change()->constrained('categories')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        // فـ حالة الـ Rollback نقدروا نرجعوا الـ Cascades إلا بغينا، 
        // ولكن غالباً فـ هاد المرحلة الـ Restrict هو اللي كيكون مطلوب دائماً.
    }
};