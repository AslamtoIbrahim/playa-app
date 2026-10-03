<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'date',
        'customer_id',
        'session_id',
        'created_by',
        'type', // 'normal' ou 'usine'
        'amount',
        'boxes',
        'weight',
    ];

    /**
     * العلاقة مع الزبون (Customer)
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * العلاقة مع الحصة اليومية (Session)
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(DailySession::class, 'session_id');
    }

    /**
     * العلاقة مع المستخدم الذي أنشأ العملية
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Les lignes de distribution de la vente (alimentées par les factures d'achat).
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Calcul automatique des totaux (Total HT + Boxes + Poids).
     *
     * La vente est alimentée par les lignes de facture d'achat : le montant se
     * calcule au prix réel pratiqué, et le poids / caisses sont repris au
     * prorata de la quantité achetée sur chaque ligne de facture.
     */
    public function calculateTotals()
    {
        $items = $this->items()->with('invoiceItem')->get();

        // 1. Somme des montants (unit_count * real_price)
        $totalHT = $items->sum(function ($item) {
            return (float) $item->unit_count * (float) $item->real_price;
        });

        // 2. Somme des poids (au prorata de la ligne de facture)
        $totalWeight = $items->sum(function ($item) {
            $invoiceItem = $item->invoiceItem;

            if (! $invoiceItem || (float) $invoiceItem->unit_count <= 0) {
                return 0;
            }

            return (float) $invoiceItem->weight * ((float) $item->unit_count / (float) $invoiceItem->unit_count);
        });

        // 3. Somme des boxes (au prorata de la ligne de facture)
        $totalBoxes = $items->sum(function ($item) {
            $invoiceItem = $item->invoiceItem;

            if (! $invoiceItem || (float) $invoiceItem->unit_count <= 0) {
                return 0;
            }

            return (float) $invoiceItem->box * ((float) $item->unit_count / (float) $invoiceItem->unit_count);
        });

        // 4. Net à Payer : la vente reste au HT (pas de TVA côté vente)
        $netToPay = $totalHT;

        // 5. Sauvegarde forceFill bach n-tjanbo l-mass assignment protection
        $this->forceFill([
            'amount' => $netToPay,
            'boxes' => (int) round($totalBoxes),
            'weight' => round($totalWeight, 2),
        ])->save();
    }

    /**
     * Boot function pour les valeurs par défaut
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->type = $model->type ?? 'normal';
            $model->boxes = $model->boxes ?? 0;
            $model->amount = $model->amount ?? 0;
            $model->weight = $model->weight ?? 0;
        });
    }
}
