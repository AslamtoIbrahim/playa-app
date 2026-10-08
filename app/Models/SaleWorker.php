<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Amount of an attendance wage assigned to a sale.
 *
 * An attendance (total_wage) can be split across several sales of the same
 * daily session until exhausted. The sale totals include these amounts.
 */
class SaleWorker extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sale_id',
        'attendance_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::saved(function ($worker) {
            $worker->sale?->calculateTotals();
        });

        static::deleted(function ($worker) {
            $worker->sale?->calculateTotals();
        });
    }
}
