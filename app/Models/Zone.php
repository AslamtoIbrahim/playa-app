<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes; // ضرورية حيت زدناها فـ الـ Migration

class Zone extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * الحقول اللي مسموح تعمرها (Mass Assignment)
     */
    protected $fillable = ['name'];

    // App\Models\Zone.php

    public function sessionZones()
    {
        return $this->hasMany(SessionZone::class);
    }
}
