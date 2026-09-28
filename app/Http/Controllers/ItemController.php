<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return inertia('items', [
            'items' => Item::with('category')->latest()->get(),
            'categories' => Category::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // 1. تنظيف الداتا وتوحيدها
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        // 2. البحث في الأرشيف (بما في ذلك المحذوفين soft deleted)
        $existingItem = Item::withTrashed()->where('name', $request->name)->first();

        if ($existingItem) {
            // إيلا كان كاين وما ممسوحش -> Validation Error (حيت فعلا كاين تكرار)
            if (! $existingItem->trashed()) {
                return back()->withErrors(['name' => 'Cet article existe déjà.']);
            }

            // إيلا كان ف الأرشيف (Trashed) -> نرجعوه ونحدثو الكاطيغوري ديالو
            $existingItem->update([
                'category_id' => $request->category_id,
            ]);

            $existingItem->restore();

            return redirect()->back()->with('success', 'Article récupéré de l\'archive avec succès ! ♻️');
        }

        // 3. إيلا ما كاينش نهائيا، نكريوه عادي
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:items,name',
            'category_id' => 'required|exists:categories,id',
        ], [
            'name.unique' => 'Cet article existe déjà.',
            'name.required' => 'Le nom de l\'article est obligatoire.',
            'category_id.required' => 'Veuillez choisir une catégorie.',
        ]);

        Item::create($validated);

        return redirect()->back()->with('success', 'Article créé avec succès ! ✨');
    }

    /**
     * Enregistrer plusieurs articles d'un coup (Bulk), chacun avec sa catégorie.
     * Les doublons existants sont ignorés et les articles archivés sont restaurés.
     */
    public function bulkStore(Request $request)
    {
        // 1. تنظيف الداتا: توحيد السمية، حذف الأسطر الفارغة، وإزالة التكرار داخل نفس اللائحة
        $request->merge([
            'items' => collect($request->input('items', []))
                ->filter(fn ($item) => is_array($item))
                ->map(fn ($item) => [
                    'name' => strtolower(trim((string) ($item['name'] ?? ''))),
                    'category_id' => $item['category_id'] ?? null,
                ])
                ->reject(fn ($item) => $item['name'] === '' && blank($item['category_id']))
                ->unique(fn ($item) => $item['name'])
                ->values()
                ->all(),
        ]);

        // 2. التحقق من صحة اللائحة كاملة
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.category_id' => 'required|exists:categories,id',
        ], [
            'items.required' => 'Ajoutez au moins un article.',
            'items.min' => 'Ajoutez au moins un article.',
            'items.*.name.required' => 'Le nom de l\'article est obligatoire.',
            'items.*.name.max' => 'Le nom de l\'article ne peut pas dépasser 255 caractères.',
            'items.*.category_id.required' => 'Veuillez choisir une catégorie.',
            'items.*.category_id.exists' => 'La catégorie choisie est introuvable.',
        ]);

        $created = 0;
        $restored = 0;
        $skipped = 0;

        // 3. المعالجة داخل Transaction وحدة
        DB::transaction(function () use ($validated, &$created, &$restored, &$skipped) {
            foreach ($validated['items'] as $row) {
                $existingItem = Item::withTrashed()->where('name', $row['name'])->first();

                // مالقيناش السمية -> إنشاء جديد
                if (! $existingItem) {
                    Item::create([
                        'name' => $row['name'],
                        'category_id' => $row['category_id'],
                    ]);

                    $created++;

                    continue;
                }

                // كان ف الأرشيف (Trashed) -> نرجعوه ونحدثو الكاطيغوري ديالو
                if ($existingItem->trashed()) {
                    $existingItem->update([
                        'category_id' => $row['category_id'],
                    ]);

                    $existingItem->restore();

                    $restored++;

                    continue;
                }

                // كاين و نشيط -> كيتجاهل
                $skipped++;
            }
        });

        $message = collect([
            $created > 0 ? "{$created} article(s) créé(s)" : null,
            $restored > 0 ? "{$restored} restauré(s) depuis l'archive" : null,
            $skipped > 0 ? "{$skipped} ignoré(s) (déjà existants)" : null,
        ])->filter()->implode(', ');

        return redirect()->back()->with('success', $message.'. ✅');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                // كنتأكدوا بلي السمية unique ولكن نتجاهلو الـ ID الحالي
                Rule::unique('items', 'name')->ignore($item->id),
            ],
            'category_id' => 'required|exists:categories,id',
        ], [
            'name.unique' => 'Cet article existe déjà.',
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', 'Article mis à jour avec succès ! 🔄');
    }

    /**
     * Archiver un article (Soft Delete)
     */
    public function destroy(Item $item)
    {
        // 1. تشيك واش السلعة مستعملة ف الفواتير
        $usageCount = $item->invoiceItems()->count();

        if ($usageCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver '{$item->name}' : il est utilisé dans $usageCount ligne(s) de facture(s)."
            );
        }

        // 2. Soft Delete
        $item->delete();

        return redirect()->back()->with('success', "L'article '{$item->name}' a été archivé. 🗑️");
    }
}
