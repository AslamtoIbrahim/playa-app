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
     * Montants de bons de réception imputés à cette vente.
     */
    public function charges(): HasMany
    {
        return $this->hasMany(SaleCharge::class);
    }

    /**
     * Parts de masse salariale imputées à cette vente (SaleWorkers).
     */
    public function workers(): HasMany
    {
        return $this->hasMany(SaleWorker::class);
    }

    /**
     * Calcul automatique des totaux (Total HT + Boxes + Poids).
     *
     * La vente est alimentée par les lignes de facture d'achat : le montant se
     * calcule au prix réel pratiqué, et le poids / caisses sont repris au
     * prorata de la quantité achetée sur chaque ligne de facture. Les montants
     * des bons de réception imputés (SaleCharges) s'ajoutent au montant, sans
     * toucher au poids ni aux caisses (une charge ne porte que de l'argent).
     */
    public function calculateTotals()
    {
        $items = $this->items()->with('invoiceItem')->get();

        // 1. Somme des montants (unit_count * real_price)
        $totalHT = $items->sum(function ($item) {
            return (float) $item->unit_count * (float) $item->real_price;
        });

        // 1b. Montants des bons imputés à cette vente (pas de double comptage :
        // les charges ne recouvrent jamais les lignes de facture).
        $chargesTotal = (float) $this->charges()->sum('amount');

        // 1c. Parts de masse salariale imputées (SaleWorkers) : une part ne
        // porte que de l'argent, sans poids ni caisses, et sans double comptage
        // avec les lignes de facture ni avec les bons.
        $workersTotal = (float) $this->workers()->sum('amount');

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

        // 4. Net à Payer : la vente reste au HT (pas de TVA côté vente),
        // augmentée des bons imputés et des parts ouvriers affectées.
        $netToPay = $totalHT + $chargesTotal + $workersTotal;

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
