<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Difference extends Model
{
    protected $fillable = [
        'invoice_item_id', // Nullable for Hortax
        'customer_id',
        'item_id',
        'unit_count',
        'real_price',
        'total_diff',
        'position',
        'amount',
        'boxes', // الحقل الجديد
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::saved(function (Difference $difference) {
            foreach ($difference->saleItems()->get() as $saleItem) {
                $saleItem->update([
                    'unit_count' => $difference->unit_count,
                    'real_price' => $difference->real_price,
                ]);
            }
        });

        static::deleting(function (Difference $difference) {
            $difference->saleItems()->get()->each->delete();
        });
    }
}
