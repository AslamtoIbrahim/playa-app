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
        Schema::create('daily_sessions', function (Blueprint $table) {
            $table->id();
            $table->date('session_date')->unique(); // نهار واحد = حصة واحدة
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->decimal('total_buy', 15, 2)->default(0);  // مجموع الشراء
            $table->decimal('total_sell', 15, 2)->default(0); // مجموع البيع
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users'); // غادي نربطوه نهار نزيدو الـ Users
            $table->timestamps();
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_sessions');
    }
};
