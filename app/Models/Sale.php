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
        'weight'
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
     * العناصر المرتبطة بالبيع (Items)
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class)->orderBy('position', 'asc');
    }

    /**
     * Calcul automatique des totaux (Total HT + Boxes)
     * Bla TVA hit hadi Sale machi Invoice
     */
    public function calculateTotals()
    {
        $items = $this->items()->get();

        // 1. Somme des montants (unit_count * unit_price)
        $totalHT = $items->sum('amount');

        // 2. Somme des poids
        $totalWeight = $items->sum('weight');

        // 3. Somme des boxes
        $totalBoxes = $items->sum('box');

        // 4. Net à Payer
        // Hna n-9dro n-khaliwha ghir HT, aw ila 3ndek 1dh dyal l-sandoq zidha
        $netToPay = $totalHT; 

        // 5. Sauvegarde forceFill bach n-tjanbo l-mass assignment protection
        $this->forceFill([
            'amount' => $netToPay,
            'boxes'  => $totalBoxes,
            'weight' => $totalWeight,
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