<?php

namespace App\Models;

use App\Models\Boat;
use App\Models\Customer;
use App\Models\DailySession;
use App\Models\ReceiptItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Receipt extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'date',
        'customer_id',
        'boat_id',
        'session_id',
        'quantity',
        'total_amount',
        'total_boxes',
    ];

    /**
     * Relationship with Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * العلاقة مع البابور (Nullable)
     */
    public function boat(): BelongsTo
    {
        return $this->belongsTo(Boat::class);
    }

    /**
     * Relationship with DailySession
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(DailySession::class, 'session_id');
    }

    /**
     * Relationship with ReceiptItems
     */
    public function items(): HasMany
    {
        return $this->hasMany(ReceiptItem::class);
    }

    /**
     * Automatic calculation logic
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($receipt) {
            // Logic for automatic updates can be added here if needed
            return;
        });
    }

    /**
     * حساب المجاميع وتحديث الموديل
     */
    public function calculateTotals(): void
    {
        $this->quantity = $this->items()->sum('unit_count');
        $this->total_amount = $this->items()->sum('total_diff');
        $this->total_boxes = $this->items()->sum('box');

        $this->save();
    }
}
