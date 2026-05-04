<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attendance extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'daily_session_id',
        'total_wage'
    ];

    /**
     * هاد الخاصية كاتخلي الـ date يبان ديما فـ الـ JSON 
     * واخا هو أصلاً ما كاينش فـ الـ Database table ديال هاد الموديل
     */
    protected $appends = ['date'];

    /**
     * Accessor: كايجيب التاريخ من الموديل ديال الـ Session
     */
    public function getDateAttribute()
    {
        return $this->session?->session_date;
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(DailySession::class, 'daily_session_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(AttendanceItem::class);
    }
}