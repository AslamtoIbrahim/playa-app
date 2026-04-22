<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Invoice extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'date',
        'invoice_number',
        'type',
        'billable_id',
        'billable_type',
        'session_id',
        'office_room_id',
        'created_by',
        'status',
        'amount',
        'tva',
        'boxes',
        'weight'
    ];

    /**
     * Polymorphic Relationship (Customer or Company)
     */
    public function billable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Relationships
     */
    public function items()
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('position', 'asc');
    }

    public function officeRoom()
    {
        return $this->belongsTo(OfficeRoom::class);
    }

    public function session()
    {
        return $this->belongsTo(DailySession::class, 'session_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Calcul automatique des totaux
     */
    public function calculateTotals()
    {
        $items = $this->items()->get();

        // 1. Total HT
        $totalHT = $items->sum('amount');

        // 2. Total Poids
        $totalWeight = $items->sum('weight');

        // 3. Calcul des Boxes (Unité != 'kg')
        $totalBoxes = $items->where('unit', '!=', 'kg')->sum('unit_count');

        // 4. Calcul TVA (3%)
        $tvaAmount = $totalHT * 0.03;

        // 5. Net à Payer (HT + TVA + Frais de boxes)
        // ملاحظة: هنا كنزيدو درهم واحد لكل صندوق إذا كان هذا هو المنطق المعمول به
        $netToPay = $totalHT + $tvaAmount + ($totalBoxes * 1);

        // 6. Sauvegarde
        $this->forceFill([
            'amount' => $netToPay,
            'tva'    => $tvaAmount,
            'boxes'  => $totalBoxes,
            'weight' => $totalWeight,
        ])->save();
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // حيدنا الحساب ديال invoice_number من هنا حيت ولا كيجي واجد من الـ Controller

            // خلي غير القيم الافتراضية إيلا بغيتي
            $model->status = $model->status ?? 'pending';
            $model->tva = $model->tva ?? 0;
            $model->boxes = $model->boxes ?? 0;
            $model->amount = $model->amount ?? 0;
            $model->weight = $model->weight ?? 0;
        });
    }

    /**
     * Mise à jour du statut selon les paiements
     */
    public function updateStatus()
    {
        $totalPaid = $this->payments()->sum('amount');

        if ($totalPaid <= 0) {
            $newStatus = 'unpaid';
        } elseif ($totalPaid < $this->amount) {
            $newStatus = 'partially_paid';
        } else {
            $newStatus = 'paid';
        }

        $this->update(['status' => $newStatus]);
    }
}
