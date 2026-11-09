<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceptionRecord extends Model
{
    protected $fillable = [
        'usine_id',
        'session_id',
        'sale_item_id',
        'weight',
        'ttc',
        'amount',
        'margin_percentage',
        'invoice_reference',
    ];

    protected $casts = [
        'sale_item_id' => 'integer',
        'weight' => 'decimal:2',
        'ttc' => 'decimal:2',
        'amount' => 'decimal:2',
        'margin_percentage' => 'decimal:2',
        'is_invoiced' => 'boolean',
        'invoice_reference' => 'integer',
    ];

    public function usine(): BelongsTo
    {
        return $this->belongsTo(Usine::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(DailySession::class, 'session_id')->withTrashed();
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class, 'sale_item_id');
    }
}
