<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return inertia('categories', [
            'categories' => Category::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        Category::create($validated);

        return redirect()->back()->with('success', 'Category created!');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Category updated!');
    }

    /**
     * أرشفة صنف (Category)
     */
    public function destroy(Category $category)
    {
        // 1. تشيك واش هاد الصنف فيه سلع (Items)
        // لازم تكون عندك علاقة items() فـ الموديل Category
        $itemsCount = $category->items()->count();

        // 2. المنع إذا كان الصنف عامر بالسلع
        if ($itemsCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver la catégorie '{$category->name}' : elle contient $itemsCount article(s) actif(s)."
            );
        }

        // 3. الأرشفة (Soft Delete)
        $category->delete();

        return redirect()->back()->with('success', "La catégorie '{$category->name}' a été archivée avec succès. 📁");
    }
}
