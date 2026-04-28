<?php

namespace App\Models;

use App\Models\Boat;
use App\Models\Invoice;
use App\Models\Item;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'box',
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
     * تعريف العلاقة مع الـ ReceiptItems
     */
    public function receiptItems(): HasMany
    {
        return $this->hasMany(ReceiptItem::class, 'invoice_item_id');
    }

    /**
     * العلاقة مع المركب
     */
    public function boat()
    {
        return $this->belongsTo(Boat::class, 'boat_id');
    }


    public function differences(): HasMany
    {
        return $this->hasMany(Difference::class)->orderBy('position', 'asc');
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

        // 2. تحديث جميع الفروقات (Differences) فور تغيير الثمن الرئيسي
        static::updated(function ($item) {
            // نتحقق أولاً هل تغير الثمن فعلاً لتجنب الحلقات اللانهائية
            if ($item->wasChanged('unit_price')) {
                foreach ($item->differences as $diff) {
                    // إعادة حساب الفرق بناءً على الثمن الجديد
                    // total_diff = (الثمن الحقيقي - الثمن الجديد في الفاتورة) * الكمية
                    $diff->total_diff = ($diff->real_price - $item->unit_price) * $diff->unit_count;
                    $diff->save();
                }
            }
        });

        // 3. إعطاء آخر ترتيب للسطر الجديد تلقائياً
        static::creating(function ($item) {
            if (is_null($item->position)) {
                $item->position = static::where('invoice_id', $item->invoice_id)->max('position') + 1;
            }
        });

        // 4. Global Scope باش ديما يرجعوا السطور مرتبين
        static::addGlobalScope('order', function (Builder $builder) {
            $builder->orderBy('position', 'asc');
        });
    }
}
