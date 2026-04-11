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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            // الربط مع الفاتورة
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');

            $table->decimal('amount', 15, 2); // شحال تخلص
            $table->date('payment_date');    // تاريخ الأداء
            $table->string('method');        // cash, check, transfer...
            $table->string('reference')->nullable(); // رقم الشيك مثلاً

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
