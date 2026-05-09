<?php

namespace App\Models;

use App\Models\Boat;
use App\Models\Customer;
use App\Models\ReceiptItem;
use App\Models\SessionZone; // Changed from DailySession
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Receipt extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'date',
        'customer_id',
        'boat_id',
        'session_zone_id', // Changed from session_id
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
     * Relationship with SessionZone (Changed from DailySession)
     */
    public function sessionZone(): BelongsTo // Changed method name from session to sessionZone
    {
        return $this->belongsTo(SessionZone::class, 'session_zone_id');
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
    // public function calculateTotals(): void
    // {
    //     $this->quantity = $this->items()->sum('unit_count');
    //     $this->total_amount = $this->items()->sum('total_diff');
    //     $this->total_boxes = $this->items()->sum('box');

    //     $this->save();
    // }

    public function calculateTotals(): void
    {
        // 1. حساب مجموع الكمية (unit_count)
        $this->quantity = (float) $this->items()->sum('unit_count');

        // 2. حساب المجموع المالي (ضرب الكمية في الثمن الحقيقي لكل سطر)
        // كنستخدمو DB::raw باش تكون العملية سريعة فـ Database
        $this->total_amount = (float) $this->items()
            ->select(DB::raw('SUM(unit_count * real_price) as total'))
            ->value('total') ?? 0;

        // 3. بخصوص الصناديق (boxes): 
        // إلا ما كانش عندك هاد العمود فـ table receipt_items، حيد هاد السطر أو ردو 0
        // إلا كان كاين، خليها هكا:
        $this->total_boxes = (float) $this->items()->sum('box');

        $this->save();
    }
}
