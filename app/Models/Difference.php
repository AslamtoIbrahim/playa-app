<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Difference extends Model
{
    protected $fillable = [
        'invoice_item_id', 'customer_id', 'unit_count', 'real_price', 'total_diff'
    ];

    public function invoiceItem()
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
