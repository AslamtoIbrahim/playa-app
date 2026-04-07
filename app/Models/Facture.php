<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $fillable = [
        'number',
        'account_id',
        'date',
        'amount',
        'weight',
        'status',
        'created_by'
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // كيجيب أخر ID وكيزيد عليه 1
            $latestId = static::max('id') ?? 0;
            $model->number = 'FAC-' . str_pad($latestId + 1, 5, '0', STR_PAD_LEFT);
        });
    }

    // داخل App\Models\Facture.php
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * هاد الـ Function هي اللي كاتحسب الـ Status بناءً على الأداءات
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

        // كانديرو update غير لـ status بوحدو بلا ما نأثرو على باقي الحقول
        $this->update(['status' => $newStatus]);
    }

    // دالة مساعدة (Helper) باش نعرفو شحال باقي ما تخلص
    public function getRemainingAmountAttribute()
    {
        return $this->amount - $this->payments()->sum('amount');
    }
}
