<?php

namespace App\Models;

use App\Models\AttendanceItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendance extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'session_zone_id', // Changed from daily_session_id
        'total_wage'
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
}
