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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->date('date'); // تاريخ الفاتورة
            $table->bigInteger('invoice_number')->unique(); // رقم الفاتورة (Unique)

            // Polymorphic Relationship (Owner/Client)
            // هادو كيعوضو account_id و كيربطو مع Company أو Customer
            $table->unsignedBigInteger('billable_id');
            $table->string('billable_type');

            // Foreign Keys (الارتباطات)
            $table->foreignId('session_id')->constrained('daily_sessions')->restrictOnDelete();
            $table->enum('type', ['sale', 'purchase']);
            
            $table->foreignId('office_room_id')->nullable()->constrained('office_rooms')->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users');

            // Financial & Data Fields (الحسابات)
            $table->bigInteger('tva')->default(0);      // الضريبة
            $table->bigInteger('boxes')->default(0);    // عدد الصنادق
            $table->decimal('weight', 12, 2)->default(0); // الوزن الإجمالي
            $table->decimal('amount', 15, 2)->default(0); // المبلغ الإجمالي (Total)
            
            $table->string('status')->default('pending'); // حالة الفاتورة (pending, paid, etc.)

            $table->timestamps();
            $table->softDeletes(); // للأرشفة

            // Index باش تكون السرعة فـ الـ Filtering
            $table->index(['billable_id', 'billable_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};