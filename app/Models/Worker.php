<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Worker extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
    ];

    public function attendances()
    {
        return $this->hasManyThrough(
            Attendance::class,
            AttendanceItem::class,
            'worker_id',    // Foreign key on attendance_items table
            'id',           // Foreign key on attendances table
            'id',           // Local key on workers table
            'attendance_id' // Local key on attendance_items table
        );
    }
}
