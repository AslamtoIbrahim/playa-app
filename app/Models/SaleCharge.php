<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Amount of a receipt sold/assigned to a sale.
 *
 * A receipt (total_amount) can be split across several sales of the same
 * daily session until exhausted. The sale totals include these charges.
 */
class SaleCharge extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sale_id',
        'receipt_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::saved(function ($charge) {
            $charge->sale?->calculateTotals();
        });

        static::deleted(function ($charge) {
            $charge->sale?->calculateTotals();
        });
    }
}
