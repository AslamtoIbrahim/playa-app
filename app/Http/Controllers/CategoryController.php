<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index()
    {
        return inertia('categories', [
            'categories' => Category::latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        // 1. توحيد السمية (lowercase + trim)
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        // 2. التحقق واش كاينة ف الأرشيف (Trashed)
        $existingCategory = Category::withTrashed()->where('name', $request->name)->first();

        if ($existingCategory) {
            if (! $existingCategory->trashed()) {
                // إيلا كاينة وما ممسوحاش، كنطبقو الـ Validation العادي باش يطلع ميساج "déjà existe"
                $request->validate([
                    'name' => 'unique:categories,name',
                ], [
                    'name.unique' => 'Cette catégorie existe déjà.',
                ]);
            }

            // إيلا كانت ممسوحة، كنرجعوها (Restore)
            $existingCategory->restore();
            $existingCategory->refresh();

            return redirect()->back()->with('success', 'La catégorie a été récupérée de l\'archive ! ♻️');
        }

        // 3. إيلا ما كاينش تكرار نهائيا، كنكريوها عادي
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ], [
            'name.required' => 'Le nom de la catégorie est obligatoire.',
        ]);

        Category::create($validated);

        return redirect()->back()->with('success', 'Catégorie créée avec succès ! ✨');
    }

    /**
     * Enregistrer plusieurs catégories d'un coup (Bulk).
     * Les doublons existants sont ignorés et les catégories archivées sont restaurées.
     */
    public function bulkStore(Request $request)
    {
        // 1. توحيد السمية + حذف الفراغات + إزالة التكرار داخل نفس اللائحة
        $request->merge([
            'names' => collect($request->input('names', []))
                ->map(fn ($name) => strtolower(trim((string) $name)))
                ->filter()
                ->unique()
                ->values()
                ->all(),
        ]);

        // 2. التحقق من صحة اللائحة كاملة
        $validated = $request->validate([
            'names' => 'required|array|min:1',
            'names.*' => 'required|string|max:255',
        ], [
            'names.required' => 'Ajoutez au moins un nom de catégorie.',
            'names.min' => 'Ajoutez au moins un nom de catégorie.',
            'names.*.required' => 'Le nom de la catégorie est obligatoire.',
            'names.*.max' => 'Le nom de la catégorie ne peut pas dépasser 255 caractères.',
        ]);

        $created = 0;
        $restored = 0;
        $skipped = 0;

        // 3. المعالجة داخل Transaction وحدة
        DB::transaction(function () use ($validated, &$created, &$restored, &$skipped) {
            foreach ($validated['names'] as $name) {
                $existingCategory = Category::withTrashed()->where('name', $name)->first();

                // مالقيناش السمية -> إنشاء جديد
                if (! $existingCategory) {
                    Category::create(['name' => $name]);
                    $created++;

                    continue;
                }

                // كاينة ولكن ممسوحة (archivée) -> Restore
                if ($existingCategory->trashed()) {
                    $existingCategory->restore();
                    $restored++;

                    continue;
                }

                // كاينة و نشيطة -> كنتجاهلوها باش ما نكرهوش Doublons
                $skipped++;
            }
        });

        $message = collect([
            $created > 0 ? "{$created} catégorie(s) créée(s)" : null,
            $restored > 0 ? "{$restored} restaurée(s)" : null,
            $skipped > 0 ? "{$skipped} ignorée(s) (déjà existantes)" : null,
        ])->filter()->implode(', ');

        return redirect()->back()->with('success', $message.'. ✅');
    }

    public function update(Request $request, Category $category)
    {
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
        ], [
            'name.unique' => 'Cette catégorie existe déjà.',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Catégorie mise à jour avec succès ! 🔄');
    }

    /**
     * Archivage (Soft Delete)
     */
    public function destroy(Category $category)
    {
        // تشيك واش كاينين سلع مرتبطين
        $itemsCount = $category->items()->count();

        if ($itemsCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver la catégorie '{$category->name}' : elle contient $itemsCount article(s)."
            );
        }

        $category->delete();

        return redirect()->back()->with('success', "La catégorie '{$category->name}' a été archivée. 📁");
    }
}
