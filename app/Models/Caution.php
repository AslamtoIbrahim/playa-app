<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Caution extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'owner_id', 'owner_type'];

    /**
     * توحيد طريقة كتابة اسم الضمانة (مثلا تخزينها lowercase وإظهارها Capitalized)
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower(trim($value)),
        );
    }

    /**
     * الحصول على المالك (Customer أو Company)
     */
    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * الفواتير المرتبطة بهذه الضمانة
     * (خاصك تزيد caution_id في جدول invoices إلا بغيتي تربطهم)
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * العناصر المرتبطة بالفواتير التي استعملت هذه الضمانة
     */
    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}