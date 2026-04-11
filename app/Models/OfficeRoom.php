<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OfficeRoom extends Model
{
    use SoftDeletes;
    use HasFactory;

    protected $fillable = [
        'name',
        'city'
    ];

    // علاقة الربط: المكتب الواحد عندو بزاف ديال الفواتير
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}