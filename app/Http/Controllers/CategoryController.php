<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index()
    {
        return inertia('categories', [
            'categories' => Category::latest()->get()
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
            if (!$existingCategory->trashed()) {
                // إيلا كاينة وما ممسوحاش، كنطبقو الـ Validation العادي باش يطلع ميساج "déjà existe"
                $request->validate([
                    'name' => 'unique:categories,name',
                ], [
                    'name.unique' => 'Cette catégorie existe déjà.',
                ]);
            }

            // إيلا كانت ممسوحة، كنرجعوها (Restore)
            $existingCategory->restore();

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