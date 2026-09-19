<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class DailySession extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'session_date',
        'status',
        'total_buy',
        'total_sell',
        'closed_at',
        'closed_by',
    ];

    protected $casts = [
        'session_date' => 'datetime',
        'closed_at' => 'datetime',
        'total_buy' => 'float',  // زدت هادو باش Laravel يتعامل معاهم كأرقام ماشي string
        'total_sell' => 'float',
    ];

    /**
     * كاع الفواير المرتبطة بالحصة
     */
    public function invoices(): HasManyThrough
    {
        // Pas de session_id sur invoices : on passe par session_zones.
        return $this->hasManyThrough(
            Invoice::class,
            SessionZone::class,
            'daily_session_id', // FK sur session_zones
            'session_zone_id',  // FK sur invoices
            'id',
            'id'
        );
    }

    /**
     * غير المشتريات (Purchases)
     */
    public function purchases(): HasManyThrough
    {
        return $this->invoices()->where('invoices.type', 'purchase');
    }

    /**
     * غير المبيعات (Sales)
     */
    public function sales(): HasMany
    {
        // Les ventes directes gardent bien une colonne session_id sur la table sales.
        return $this->hasMany(Sale::class, 'session_id');
    }

    public function zones()
    {
        return $this->belongsToMany(Zone::class, 'session_zones');
    }

    public function sessionZones(): HasMany
    {
        return $this->hasMany(SessionZone::class, 'daily_session_id');
    }
}
