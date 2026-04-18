<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class OfficeRoom extends Model
{
    use SoftDeletes, HasFactory;

    protected $fillable = [
        'name',
        'city'
    ];

    /**
     * توحيد طريقة تخزين وعرض المدينة
     */
    protected function city(): Attribute
    {
        return Attribute::make(
            // ملي كتعرضها: كترجع أول حرف كبير (مثلا: Casablanca)
            get: fn (?string $value) => $value ? ucfirst($value) : null,
            // ملي كتسيفيها: كتردها ديما lowercase باش الـ unique تخدم مزيان
            set: fn (?string $value) => $value ? strtolower(trim($value)) : null,
        );
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}