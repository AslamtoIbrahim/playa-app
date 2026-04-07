<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    // هادو هما العمدة اللي مسموح ليهم يتسجلو (Fillable)
    protected $fillable = [
        'name',
        'title',
        'type',
        'created_by'
    ];

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    // علاقة الربط مع الـ User (Admin)
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
