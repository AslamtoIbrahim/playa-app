<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. إنشاء جدول Office Room
        Schema::create('office_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('city')->nullable();
            $table->timestamps();
        });

        // 2. تحديث جدول Invoices (اللي بدلنا ليه السمية قبل)
        Schema::table('invoices', function (Blueprint $table) {
            // مسح حقل caution (ما بقيناش محتاجينه)
            if (Schema::hasColumn('invoices', 'caution')) {
                $table->dropColumn('caution');
            }

            // إضافة الربط مع Office Room بعد الـ account_id
            $table->foreignId('office_room_id')->nullable()->after('account_id')->constrained('office_rooms')->onDelete('set null');

            // إضافة حقول المجاميع اللي غايجيو من الـ Pivot table
            $table->decimal('tva', 15, 2)->default(0)->after('office_room_id');
            $table->integer('boxes')->default(0)->after('tva');
            
            // التأكد من أن status موجود (كان pending افتراضياً)
            if (!Schema::hasColumn('invoices', 'status')) {
                $table->string('status')->default('pending')->after('weight');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('office_room_id');
            $table->dropColumn(['tva', 'boxes']);
            $table->string('caution')->nullable();
        });

        Schema::dropIfExists('office_rooms');
    }
};