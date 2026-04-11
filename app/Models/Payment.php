<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    
    protected $fillable = [
        'facture_id',
        'amount',
        'payment_date',
        'method',
        'reference',
        'created_by'
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    protected static function booted()
    {
        // فاش يتسجل أداء جديد أو يتعدل
        static::saved(function ($payment) {
            if ($payment->facture) {
                $payment->facture->updateStatus();
            }
        });

        // فاش يتمسح شي أداء
        static::deleted(function ($payment) {
            if ($payment->facture) {
                $payment->facture->updateStatus();
            }
        });
    }
}
