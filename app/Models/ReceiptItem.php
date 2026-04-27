<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptItem extends Model
{
    protected $fillable = [
        'receipt_id',
        'item_id',
        'unit_count',
        'real_price',
        'box',
        'total_diff',
        'position' 
    ];

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    protected static function boot()
    {
        parent::boot();

        // 1. إعطاء آخر ترتيب للسطر الجديد تلقائياً
        static::creating(function ($item) {
            if (is_null($item->position)) {
                // كنقلبو على أكبر position فـ هاد الـ receipt بالخصوص
                $maxPosition = static::where('receipt_id', $item->receipt_id)->max('position');
                $item->position = $maxPosition ? $maxPosition + 1 : 0;
            }

            // 2. حساب الـ total_diff تلقائياً قبل الحفظ (باش ما يبقاش يجي من الفرونت فيه غلط)
            $item->total_diff = $item->unit_count * $item->real_price;
        });

        // تحديث المجموع عند أي تغيير
        static::saved(function ($item) {
            $item->updateReceiptTotals();
        });

        static::deleted(function ($item) {
            $item->updateReceiptTotals();
        });

        // 3. Global Scope باش ديما يرجعوا السطور مرتبين
        static::addGlobalScope('order', function (Builder $builder) {
            $builder->orderBy('position', 'asc');
        });
    }

    public function updateReceiptTotals(): void
    {
        $receipt = $this->receipt;

        if ($receipt) {
            // حساب المجاميع من الـ Database مباشرة
            $totals = static::where('receipt_id', $this->receipt_id)
                ->selectRaw('
                    SUM(unit_count) as qty, 
                    SUM(unit_count * real_price) as amount, 
                    SUM(box) as total_boxes
                ')
                ->first();

            $receipt->update([
                'quantity'     => $totals->qty ?? 0,
                'total_amount' => $totals->amount ?? 0,
                'total_boxes'  => $totals->total_boxes ?? 0,
            ]);
        }
    }
}