<?php

namespace App\Models;

use App\Models\DailySession;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SessionZone extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'daily_session_id',
        'zone_id',
        'total_buy',
        'total_sell',
    ];

    protected $casts = [
        'total_buy' => 'decimal:2',
        'total_sell' => 'decimal:2',
    ];

    /**
     * العلاقة مع الحصة اليومية (DailySession)
     */
    public function dailySession(): BelongsTo
    {
        return $this->belongsTo(DailySession::class);
    }

    /**
     * العلاقة مع المنطقة (Zone)
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }
}
