<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Distribution d'une ligne de facture d'achat vers une vente.
 *
 * Une même ligne de facture (invoice_item) peut être vendue en plusieurs
 * fois, à des ventes différentes (donc des clients différents), jusqu'à
 * épuisement de sa quantité. Les quantités, prix et écarts viennent de la
 * différence associée et ne sont pas recalculés à partir de la facture.
 */
class SaleItem extends Model
{
    use SoftDeletes;

    protected $table = 'sale_items';

    protected $fillable = [
        'sale_id',
        'invoice_item_id',
        'difference_id',
        'unit_count',
        'real_price',
        'total_diff',
    ];

    protected $casts = [
        'unit_count' => 'decimal:2',
        'real_price' => 'decimal:2',
        'total_diff' => 'decimal:2',
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

    public function difference(): BelongsTo
    {
        return $this->belongsTo(Difference::class);
    }

    /**
     * Calcul de l'écart réel et rafraîchissement des totaux de la vente.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            if ($item->difference_id) {
                $difference = $item->difference()->firstOrFail();
                $item->real_price = $difference->real_price;
                $invoicePrice = (float) ($difference->invoiceItem?->unit_price ?? 0);
                $item->total_diff = ((float) $difference->real_price - $invoicePrice) * (float) $item->unit_count;
            }
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
