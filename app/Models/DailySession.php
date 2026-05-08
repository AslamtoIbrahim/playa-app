<?php

namespace App\Models;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DailySession extends Model
{
    use SoftDeletes;
    
    use HasFactory;

    protected $fillable = [
        'session_date',
        'status',
        'total_buy',
        'total_sell',
        'closed_at',
        'closed_by'
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
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'session_id');
    }

    /**
     * غير المشتريات (Purchases)
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Invoice::class, 'session_id')->where('type', 'purchase');
    }

    /**
     * غير المبيعات (Sales)
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Invoice::class, 'session_id')->where('type', 'sale');
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
