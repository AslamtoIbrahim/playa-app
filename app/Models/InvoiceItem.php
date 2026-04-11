<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceItem extends Model
{
    use SoftDeletes;
    // فالتصويرة عندك الجدول سميتو invoice_items
    // إيلا كان هاد هو السميّة فـ الـ Migration دير هاد السطر:
    protected $table = 'invoice_items';

    protected $fillable = [
        'invoice_id',
        'item_id',
        'boat_id',
        'unit',
        'unit_count',
        'unit_price',
        'weight',
        'amount'
    ];

    /**
     * العلاقة مع الفاتورة الكبيرة
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * العلاقة مع نوع السلعة (الجدول اللي فيه الأخطبوط، الكلامار، إلخ)
     */
    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    /**
     * العلاقة مع المركب اللي جاب هاد السلعة
     */
    public function boat()
    {
        return $this->belongsTo(Boat::class, 'boat_id');
    }

    /**
     * حساب أوتوماتيكي قبل ما يتسجل السطر
     * هادي زيادة من عندي باش تضمن أن الـ amount ديما صحيح
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->amount = $item->unit_count * $item->unit_price;
        });
    }
}