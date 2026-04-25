<?php

namespace App\Models;

use App\Models\Boat;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory;

    use SoftDeletes;

    protected $fillable = ['name'];

    /**
     * توحيد طريقة كتابة اسم الشركة (poulpe sarl -> Poulpe sarl)
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn(string $value) => ucfirst($value),
            set: fn(string $value) => strtolower(trim($value)),
        );
    }

    // الشركة حتى هي تقدر تمتلك بواطويات
    public function boats(): MorphMany
    {
        return $this->morphMany(Boat::class, 'owner');
    }

    // الفواير اللي خارجين بسمية الشركة
    public function invoices(): MorphMany
    {
        return $this->morphMany(Invoice::class, 'billable');
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($company) {
            // 1. واش كاينة شي فاتورة مسجلة بسميت هاد الشركة؟
            if ($company->invoices()->count() > 0) {
                throw new \Exception("Impossible de supprimer : cette société a des factures en cours.");
            }

            // 2. واش هاد الشركة كتمتلك شي باطوات؟ 
            // (حيت درنا Morph فـ Boats، هاد العلاقة ضرورية)
            if ($company->boats()->count() > 0) {
                throw new \Exception("Impossible de supprimer : cette société possède encore des bateaux.");
            }
        });
    }
}
