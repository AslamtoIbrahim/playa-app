<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendance extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'session_zone_id', // Changed from daily_session_id
        'total_wage',
    ];

    protected $appends = ['date'];

    /**
     * Accessor: كايجيب التاريخ من الموديل ديال الـ Session عبر SessionZone
     */
    public function getDateAttribute()
    {
        return $this->sessionZone?->dailySession?->session_date; // Access via sessionZone and dailySession
    }

    public function sessionZone(): BelongsTo // Renamed method from session to sessionZone
    {
        return $this->belongsTo(SessionZone::class, 'session_zone_id'); // Relates to SessionZone
    }

    public function items(): HasMany
    {
        return $this->hasMany(AttendanceItem::class);
    }

    /**
     * Parts de ce pointage affectées à des ventes (SaleWorkers).
     */
    public function saleWorkers(): HasMany
    {
        return $this->hasMany(SaleWorker::class);
    }

    /**
     * Montant déjà réparti de ce pointage (somme des SaleWorkers).
     */
    public function soldAmount(): float
    {
        return (float) $this->saleWorkers()->sum('amount');
    }

    /**
     * Montant encore répartissable : total_wage moins les parts déjà affectées.
     */
    public function remainingAmount(): float
    {
        return (float) $this->total_wage - $this->soldAmount();
    }
}
