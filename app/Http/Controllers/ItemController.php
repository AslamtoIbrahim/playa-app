<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;
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
            'categories' => Category::all()
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
            if (!$existingItem->trashed()) {
                return back()->withErrors(['name' => 'Cet article existe déjà.']);
            }

            // إيلا كان ف الأرشيف (Trashed) -> نرجعوه ونحدثو الكاطيغوري ديالو
            $existingItem->update([
                'category_id' => $request->category_id
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