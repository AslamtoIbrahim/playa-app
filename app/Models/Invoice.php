<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'date',
        'invoice_number',
        'account_id',
        'office_room_id',
        'tva',
        'boxes',
        'amount',
        'weight',
        'status',
        'created_by'
    ];

    /**
     * العلاقات
     */
    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function officeRoom()
    {
        return $this->belongsTo(OfficeRoom::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * حساب المجاميع أوتوماتيكياً
     */
    public function calculateTotals()
    {
        $items = $this->items()->get();

        // 1. المجموع الصافي (HT) هو مجموع مبالغ السطور ديجا محسوبة ف Controller
        $totalHT = $items->sum('amount');
        
        // 2. مجموع الوزن الإجمالي
        $totalWeight = $items->sum('weight');

        // 3. تعديل مهم: حساب عدد الصناديق (Boxes)
        // كنجمعو غير السطور لي الوحدة ديالهم ماشي 'kg' 
        // حيت Poulpe ولينا كنصيفطو الكيلو ف unit_count وماخاصوش يتزاد ف حساب الصناديق
        $totalBoxes = $items->where('unit', '!=', 'kg')->sum('unit_count');

        // 4. حساب الضريبة (3%)
        $tvaAmount = $totalHT * 0.03;

        // 5. الحساب النهائي (Net à Payer)
        // المنطق: السلعة (HT) + الضريبة (TVA) + عدد الصناديق (درهم لكل صندوق)
        $netToPay = $totalHT + $tvaAmount + $totalBoxes;

        // 6. حفظ القيم ف الداتابيز
        $this->forceFill([
            'amount' => $netToPay, // Net à Payer
            'tva'    => $tvaAmount,
            'boxes'  => $totalBoxes,
            'weight' => $totalWeight,
        ])->save();
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // توليد رقم الفاتورة
            $latestId = static::max('id') ?? 0;
            $model->invoice_number = 'INV-' . date('Y') . '-' . str_pad($latestId + 1, 5, '0', STR_PAD_LEFT);

            // قيم افتراضية
            $model->tva = $model->tva ?? 0;
            $model->boxes = $model->boxes ?? 0;
            $model->amount = $model->amount ?? 0;
            $model->weight = $model->weight ?? 0;
            $model->status = $model->status ?? 'draft';
        });
    }

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