<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'category_id'];

    /**
     * التعامل التلقائي مع الحروف الكبيرة والصغيرة
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            // ملي تبغي تعرض السمية (مثلا ف الـ Table)
            get: fn (string $value) => ucfirst($value),
            // ملي تبغي تسجل ف الداتابيز (كتولي ديما lowercase باش الـ Unique تخدم مزيان)
            set: fn (string $value) => strtolower(trim($value)),
        );
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function invoiceItems()
    {
        // تأكد من اسم الـ Model ديال Invoice Items عندك
        return $this->hasMany(InvoiceItem::class);
    }
}