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
 * épuisement de sa quantité. Les différences de prix restent une notion
 * indépendante : elles n'affectent pas la quantité vendable.
 */
class SaleItem extends Model
{
    use SoftDeletes;

    protected $table = 'sale_items';

    protected $fillable = [
        'sale_id',
        'invoice_item_id',
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

    /**
     * Calcul de l'écart réel et rafraîchissement des totaux de la vente.
     */
    protected static function boot()
    {
        parent::boot();

        // 1. Écart réel = (prix réel - prix unitaire facturé) * quantité
        static::saving(function ($item) {
            $unitPrice = (float) ($item->invoiceItem?->unit_price ?? 0);

            $item->total_diff = ((float) $item->real_price - $unitPrice) * (float) $item->unit_count;
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
