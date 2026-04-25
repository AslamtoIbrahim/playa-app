<?php

namespace App\Models;

use App\Models\Customer;
use App\Models\InvoiceItem;
use App\Models\Item;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'boxes' // الحقل الجديد
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
}