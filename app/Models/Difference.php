<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Difference extends Model
{
    protected $fillable = [
        'invoice_item_id',
        'customer_id',
        'unit_count',
        'real_price',
        'total_diff',
        'position',
        'amount'
    ];

    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
