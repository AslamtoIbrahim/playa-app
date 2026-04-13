<?php

namespace App\Models;

use App\Models\Boat;
use App\Models\Invoice;
use App\Models\Item;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceItem extends Model
{
    use SoftDeletes;

    protected $table = 'invoice_items';

    protected $fillable = [
        'invoice_id',
        'item_id',
        'boat_id',
        'unit',
        'unit_count',
        'unit_price',
        'weight',
        'amount',
        'position' // زدنا هادي باش نقدروا نسيفيو الترتيب الجديد
    ];

    /**
     * العلاقة مع الفاتورة الكبيرة
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * العلاقة مع نوع السلعة
     */
    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    /**
     * العلاقة مع المركب
     */
    public function boat()
    {
        return $this->belongsTo(Boat::class, 'boat_id');
    }

    /**
     * الحساب الأوتوماتيكي والترتيب
     */
    protected static function boot()
    {
        parent::boot();

        // 1. حساب الـ amount تلقائياً قبل الحفظ
        static::saving(function ($item) {
            $item->amount = $item->unit_count * $item->unit_price;
        });

        // 2. إعطاء آخر ترتيب للسطر الجديد تلقائياً
        static::creating(function ($item) {
            if (is_null($item->position)) {
                $item->position = static::where('invoice_id', $item->invoice_id)->max('position') + 1;
            }
        });

        // 3. Global Scope باش ديما يرجعوا السطور مرتبين بـ position
        static::addGlobalScope('order', function (Builder $builder) {
            $builder->orderBy('position', 'asc');
        });
    }
}