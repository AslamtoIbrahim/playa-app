<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // تغيير إسم الجدول من factures إلى invoices
        Schema::rename('factures', 'invoices');
    }

    public function down(): void
    {
        Schema::rename('invoices', 'factures');
    }
};