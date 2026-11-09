<?php

use App\Models\Usine;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Backfill reception records for usine sales created before the model
     * events started generating them automatically.
     */
    public function up(): void
    {
        $usineSessions = DB::table('sales')
            ->where('owner_type', Usine::class)
            ->whereNull('deleted_at')
            ->select(['owner_id', 'session_id'])
            ->distinct()
            ->get();

        foreach ($usineSessions as $usineSession) {
            $exists = DB::table('reception_records')
                ->where('usine_id', $usineSession->owner_id)
                ->where('session_id', $usineSession->session_id)
                ->exists();

            if ($exists) {
                continue;
            }

            $saleAmount = (float) DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->where('sales.session_id', $usineSession->session_id)
                ->whereNull('sales.deleted_at')
                ->whereNull('sale_items.deleted_at')
                ->sum(DB::raw('sale_items.amount + sale_items.tax'));

            $boxFees = (float) DB::table('sales')
                ->where('session_id', $usineSession->session_id)
                ->whereNull('deleted_at')
                ->sum('boxes');

            DB::table('reception_records')->insert([
                'usine_id' => $usineSession->owner_id,
                'session_id' => $usineSession->session_id,
                'amount' => $saleAmount + $boxFees,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Backfilled records are user-editable; retain them when rolling back.
    }
};
