<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // كنصيفطو الـ items مع الـ category ديالهم باش نعرضو السمية في الـ Table
        // وكنصيفطو الـ categories بوحدهم باش نخدمو بيهم في الـ Select box ديال الـ Add/Edit
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
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ]);

        Item::create($validated);

        return redirect()->back()->with('success', 'Item created successfully! ✨');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', 'Item updated successfully! 🔄');
    }

    /**
     * أرشفة سلعة (Item)
     */
    public function destroy(Item $item)
    {
        // 1. تشيك واش هاد السلعة ديجا مسجلة فـ أسطر الفواتير (Invoice Items)
        // لازم تكون عندك علاقة invoiceItems() فـ الموديل Item
        $usageCount = $item->invoiceItems()->count();

        // 2. المنع إذا كانت السلعة مستعملة فـ أي فاتورة
        if ($usageCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver l'article '{$item->name}' : il est déjà utilisé dans $usageCount ligne(s) de facture(s)."
            );
        }

        // 3. الأرشفة (Soft Delete)
        $item->delete();

        return redirect()->back()->with('success', "L'article '{$item->name}' a été archivé مع succès. 🗑️");
    }
}
