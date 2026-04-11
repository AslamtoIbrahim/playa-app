<?php

namespace App\Models;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Account extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'title',
        'type',
        'created_by'
    ];

    // 1. تحديث العلاقة لتشير إلى Invoice عوض Facture
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    // 2. إضافة علاقة مع المراكب (Boats) المرتبطة بهذا الحساب
    public function boats(): HasMany
    {
        return $this->hasMany(Boat::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}