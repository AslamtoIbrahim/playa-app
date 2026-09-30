<?php

use App\Models\Company;
use App\Models\Receipt;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add an explicit boat link to receipt items.
     *
     * A commission belongs to the owner of the boat, not to an invoice item, so
     * `invoice_item_id` is always NULL for it. Until now the only way to find a
     * commission back was the negative leg written on the boat owner's receipt,
     * and that leg is never created when the owner is a company: such
     * commissions were invisible in the report dialog and could neither be
     * updated nor deleted.
     *
     * Stamping the boat on the line fixes it: a commission is now found from its
     * beneficiary leg, whether or not the owner leg exists.
     */
    public function up(): void
    {
        Schema::table('receipt_items', function (Blueprint $table) {
            $table->foreignId('boat_id')
                ->nullable()
                ->after('type')
                ->constrained('boats')
                ->nullOnDelete();
        });

        $this->backfillBoatId();
    }

    /**
     * Best effort recovery of the boat for the commissions that already exist.
     *
     * 1. A leg that has a twin takes the boat of its twin's receipt: the owner
     *    leg is always written on a receipt attached to the boat.
     * 2. A leg without a twin belongs to a company owner, so no receipt carries
     *    the boat. We only guess when the session zone and the date of the
     *    receipt match exactly one boat owned by a company, otherwise we leave
     *    it NULL: a wrong boat would show a commission on the wrong report.
     */
    private function backfillBoatId(): void
    {
        DB::table('receipt_items')
            ->where('type', 'commission')
            ->whereNull('boat_id')
            ->whereNotNull('commission_twin_id')
            ->orderBy('id')
            ->each(function (object $item): void {
                $twinReceipt = DB::table('receipt_items')
                    ->join('receipts', 'receipt_items.receipt_id', '=', 'receipts.id')
                    ->where('receipt_items.id', $item->commission_twin_id)
                    ->whereNotNull('receipts.boat_id')
                    ->value('receipts.boat_id');

                if ($twinReceipt) {
                    DB::table('receipt_items')
                        ->where('id', $item->id)
                        ->update(['boat_id' => $twinReceipt]);
                }
            });

        DB::table('receipt_items')
            ->where('type', 'commission')
            ->whereNull('boat_id')
            ->whereNull('commission_twin_id')
            ->orderBy('id')
            ->each(function (object $item): void {
                $receipt = DB::table('receipts')
                    ->where('id', $item->receipt_id)
                    ->first();

                if (! $receipt || ! $receipt->session_zone_id) {
                    return;
                }

                $candidates = DB::table('receipts')
                    ->join('boats', 'receipts.boat_id', '=', 'boats.id')
                    ->where('receipts.session_zone_id', $receipt->session_zone_id)
                    ->whereDate('receipts.date', $receipt->date)
                    ->whereNotNull('receipts.boat_id')
                    ->where('boats.owner_type', Company::class)
                    ->distinct()
                    ->pluck('boats.id');

                // Only act when the answer is unambiguous.
                if ($candidates->count() === 1) {
                    DB::table('receipt_items')
                        ->where('id', $item->id)
                        ->update(['boat_id' => $candidates->first()]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receipt_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('boat_id');
        });
    }
};
