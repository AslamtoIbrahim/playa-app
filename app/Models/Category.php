<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use SoftDeletes;

    protected $fillable = ['name'];

    /**
     * توحيد طريقة كتابة السمية (Lower لـ الداتابيز و Capitalize لـ العرض)
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower(trim($value)),
        );
    }

    /**
     * علاقة الكاطيغوري بالسلع
     */
    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }
}