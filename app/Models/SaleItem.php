<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Editable line item belonging to a sale.
 *
 * Invoice-backed and unspecified items share the same independent price,
 * quantity, amount, tax, and difference calculations.
 */
class SaleItem extends Model
{
    use SoftDeletes;

    protected $table = 'sale_items';

    protected $fillable = [
        'sale_id',
        'invoice_item_id',
        'item_id',
        'boat_id',
        'unit_count',
        'sale_price',
        'real_price',
        'amount',
        'tax',
        'is_with_tax',
        'total_diff',
    ];

    protected $casts = [
        'unit_count' => 'decimal:2',
        'real_price' => 'decimal:2',
        'total_diff' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'amount' => 'decimal:2',
        'tax' => 'decimal:2',
        'is_with_tax' => 'boolean',
    ];

    /**
     * العلاقة مع عملية البيع الأم
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Relation avec la ligne de facture d'achat d'origine.
     */
    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(InvoiceItem::class, 'invoice_item_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function boat(): BelongsTo
    {
        return $this->belongsTo(Boat::class);
    }

    /**
     * Calcul de l'écart réel et rafraîchissement des totaux de la vente.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $count = (float) $item->unit_count;
            $salePrice = (float) $item->sale_price;
            $item->amount = $count * (float) $item->real_price;
            $item->tax = $item->is_with_tax ? $item->amount * 0.03 : 0;
            $item->total_diff = ($salePrice - (float) $item->real_price) * $count;
        });

        // 2. Totaux de la vente recalculés après chaque changement (Save, Update, Delete)
        static::saved(function ($item) {
            $item->sale?->calculateTotals();
        });

        static::deleted(function ($item) {
            $item->sale?->calculateTotals();
        });
    }
}
