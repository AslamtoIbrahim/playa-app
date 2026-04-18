<?php

namespace App\Http\Controllers;

use App\Models\Boat;
use App\Models\Company;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BoatController extends Controller
{
    /**
     * Liste des bateaux avec leurs propriétaires (Morph)
     */
    public function index()
    {
        $boats = Boat::with('owner')->latest()->get();

        // جلب الزبناء
        $customers = Customer::select('id', 'name')->get()->map(fn($c) => [
            'id'   => $c->id,
            'name' => $c->name,
            'type' => Customer::class,
            'label' => 'Client: ' . $c->name
        ]);

        // جلب الشركات
        $companies = Company::select('id', 'name')->get()->map(fn($c) => [
            'id'   => $c->id,
            'name' => $c->name,
            'type' => Company::class,
            'label' => 'Société: ' . $c->name
        ]);

        return Inertia::render('boats', [
            'boats'  => $boats,
            'owners' => $customers->concat($companies)
        ]);
    }

    /**
     * Enregistrer un nouveau bateau أو استرجاعه من الأرشيف
     */
    public function store(Request $request)
    {
        // 1. توحيد السمية (Lowercase & Trim)
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        // 2. البحث في الأرشيف (بما في ذلك المحذوفين)
        $existingBoat = Boat::withTrashed()->where('name', $request->name)->first();

        if ($existingBoat) {
            if (!$existingBoat->trashed()) {
                // تكرار حقيقي: المركب موجود وخدام
                return back()->withErrors(['name' => 'Ce bateau existe déjà.']);
            }

            // Unarchive: المركب موجود في الأرشيف، نقوم باسترجاعه وتحديث بياناته
            $existingBoat->update([
                'owner_id'   => $request->owner_id,
                'owner_type' => $request->owner_type,
            ]);
            
            $existingBoat->restore();

            return back()->with('success', 'Bateau récupéré de l\'archive avec succès ! ⚓');
        }

        // 3. إذا لم يوجد نهائياً، نقوم بالتحقق والكارنية
        $validated = $request->validate([
            'name'       => 'required|string|max:255|unique:boats,name',
            'owner_id'   => 'required|integer',
            'owner_type' => 'required|string|in:App\Models\Customer,App\Models\Company',
        ], [
            'name.unique' => 'Ce bateau existe déjà.',
            'name.required' => 'Le nom du bateau est obligatoire.',
        ]);

        Boat::create($validated);

        return back()->with('success', 'Bateau ajouté avec succès ! ✅');
    }

    /**
     * Mettre à jour les informations du bateau
     */
    public function update(Request $request, Boat $boat)
    {
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                // السماح بنفس الاسم لهذا القارب فقط، مع استثناء المحذوفين من الفحص العادي
                Rule::unique('boats', 'name')
                    ->ignore($boat->id)
                    ->whereNull('deleted_at'),
            ],
            'owner_id'   => 'required|integer',
            'owner_type' => 'required|string|in:App\Models\Customer,App\Models\Company',
        ], [
            'name.unique' => 'Ce bateau existe déjà.',
        ]);

        $boat->update($validated);

        return back()->with('success', 'Bateau mis à jour avec succès ! ✅');
    }

    /**
     * Archiver un bateau
     */
    public function destroy(Boat $boat)
    {
        // التحقق من الارتباطات قبل الأرشفة
        $invoiceItemsCount = $boat->invoiceItems()->count();

        if ($invoiceItemsCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver le bateau '{$boat->name}' : il est lié à $invoiceItemsCount ligne(s) de facture."
            );
        }

        $boat->delete();

        return redirect()->back()->with('success', "Le bateau '{$boat->name}' a été archivé. 🗑️");
    }
}