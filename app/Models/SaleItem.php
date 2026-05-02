<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SaleItem extends Model
{
    use SoftDeletes;

    protected $table = 'sale_items';

    protected $fillable = [
        'sale_id',
        'item_id',
        'boat_id',
        'unit',
        'box',
        'unit_count',
        'unit_price',
        'weight',
        'amount',
        'position'
    ];

    /**
     * العلاقة مع عملية البيع الأم
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * العلاقة مع نوع السلعة
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    /**
     * العلاقة مع المركب (Mnin jaya l-sel3a)
     */
    public function boat(): BelongsTo
    {
        return $this->belongsTo(Boat::class, 'boat_id');
    }

    /**
     * Logic dyal l-calcul o l-automations
     */
    protected static function boot()
    {
        parent::boot();

        // 1. حساب الـ amount تلقائياً (unit_count * unit_price)
        static::saving(function ($item) {
            $item->amount = $item->unit_count * $item->unit_price;
        });

        // 2. تحديث طوطال ديال Sale مورا كل تغيير (Save, Update, Delete)
        static::saved(function ($item) {
            $item->sale->calculateTotals();
        });

        static::deleted(function ($item) {
            $item->sale->calculateTotals();
        });

        // 3. الترتيب التلقائي (Positioning)
        static::creating(function ($item) {
            if (is_null($item->position)) {
                $item->position = static::where('sale_id', $item->sale_id)->max('position') + 1;
            }
        });

        // 4. Global Scope باش السطور يخرجوا ديما مرتبين بـ position
        static::addGlobalScope('order', function (Builder $builder) {
            $builder->orderBy('position', 'asc');
        });
    }
}