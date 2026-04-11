<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // 1. جدول المراكب مرتبط بـ Account
        Schema::create('boats', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // 2. تحديث جدول الفاتورات
        Schema::table('factures', function (Blueprint $table) {
            $table->string('caution')->nullable()->after('number'); // Playa Fish, etc.
            $table->foreignId('boat_id')->nullable()->constrained()->after('account_id');
            // كنخليو amount و weight حيت غايبقاو يخدمو كـ "Total" أوتوماتيكي
        });

        // 3. جدول تفاصيل البون (السطور ديال Excel)
        Schema::create('facture_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained()->onDelete('cascade');
            $table->string('species'); // النوع (Calamar, etc.)
            $table->decimal('weight', 10, 2);
            $table->decimal('pu_facturation', 10, 2); // ثمن الفاتورة (الـ PDF)
            $table->decimal('pu_reel', 10, 2);        // ثمن المكتب (الحقيقي)
            $table->decimal('diff', 10, 2);           // الفرق
            $table->decimal('total_diff', 15, 2);     // Poids * Diff
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
