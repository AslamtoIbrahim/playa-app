<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Usine extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function sales(): MorphMany
    {
        return $this->morphMany(Sale::class, 'owner');
    }

    public function receptionRecords(): HasMany
    {
        return $this->hasMany(ReceptionRecord::class);
    }
}
