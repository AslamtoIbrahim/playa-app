<?php

namespace App\Models;

use App\Models\Boat;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Customer extends Model
{
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'name',
        'title',
        'type',
        'created_by'
    ];

    // العلاقة مع البواطويات (Morph)
    public function boats(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(Boat::class, 'owner');
    }

    // الفواير اللي خارجين بسميتو (Billable)
    public function invoices(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(Invoice::class, 'billable');
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
                throw new \Exception("Impossible de supprimer : ce client a des factures associées.");
            }

            // كنقلبو واش هاد الكليان عندو باطوات مسجلين بسميتو
            if ($customer->boats()->count() > 0) {
                throw new \Exception("Impossible de supprimer : ce client possède encore des bateaux.");
            }
        });
    }


    /**
     * توحيد طريقة كتابة اسم العميل
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn(string $value) => ucfirst($value),
            set: fn(string $value) => strtolower(trim($value)),
        );
    }
}
