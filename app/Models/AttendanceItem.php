<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AttendanceItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'attendance_id',
        'worker_id',
        'wage'
    ];

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }

    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }
}