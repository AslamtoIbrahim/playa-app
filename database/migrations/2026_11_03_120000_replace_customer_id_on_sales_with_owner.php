<?php

use App\Models\Customer;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->string('owner_type')->nullable();
        });

        DB::table('sales')->update([
            'owner_id' => DB::raw('customer_id'),
            'owner_type' => Customer::class,
        ]);

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropIndex(['customer_id', 'type']);
            $table->dropColumn('customer_id');
            $table->index(['owner_type', 'owner_id']);
            $table->unsignedBigInteger('owner_id')->nullable(false)->change();
            $table->string('owner_type')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::table('sales')->where('owner_type', '!=', Customer::class)->exists()) {
            throw new RuntimeException('Cannot restore customer_id while sales belong to non-customer owners.');
        }

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->constrained()->restrictOnDelete();
        });

        DB::table('sales')->update(['customer_id' => DB::raw('owner_id')]);

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['owner_type', 'owner_id']);
            $table->dropColumn(['owner_id', 'owner_type']);
            $table->index(['customer_id', 'type']);
            $table->unsignedBigInteger('customer_id')->nullable(false)->change();
        });
    }
};
