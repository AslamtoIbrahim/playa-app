<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'title',
        'type',
        'created_by',
    ];

    // العلاقة مع البواطويات (Morph)
    public function boats(): MorphMany
    {
        return $this->morphMany(Boat::class, 'owner');
    }

    // الفواير اللي خارجين بسميتو (Billable)
    public function invoices(): MorphMany
    {
        return $this->morphMany(Invoice::class, 'billable');
    }

    // البونات (Bons de réception) اللي مسجلين بسميتو
    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }

    // الفروقات (Differences) المسجلة على هاد الكليان
    public function differences(): HasMany
    {
        return $this->hasMany(Difference::class);
    }

    // البيوعات (Sales) المرتبطة بهاد الكليان
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($customer) {
            // كنقلبو واش هاد الكليان عندو فواتير
            if ($customer->invoices()->count() > 0) {
                throw new \Exception('Impossible de supprimer : ce client a des factures associées.');
            }

            // كنقلبو واش هاد الكليان عندو بونات (Reçus) مسجلين بسميتو
            if ($customer->receipts()->count() > 0) {
                throw new \Exception('Impossible de supprimer : ce client a des bons de réception associés.');
            }

            // كنقلبو واش هاد الكليان عندو باطوات مسجلين بسميتو
            if ($customer->boats()->count() > 0) {
                throw new \Exception('Impossible de supprimer : ce client possède encore des bateaux.');
            }

            // كنقلبو واش كاين شي فروقات (Differences) على هاد الكليان
            if ($customer->differences()->count() > 0) {
                throw new \Exception('Impossible de supprimer : ce client a des différences associées.');
            }

            // كنقلبو واش كاين شي بيوعات (Sales) على هاد الكليان
            if ($customer->sales()->count() > 0) {
                throw new \Exception('Impossible de supprimer : ce client a des ventes associées.');
            }
        });
    }

    /**
     * توحيد طريقة كتابة اسم العميل
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower(trim($value)),
        );
    }
}
