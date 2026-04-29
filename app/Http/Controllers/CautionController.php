<?php

namespace App\Http\Controllers;

use App\Models\Caution;
use App\Models\Company;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CautionController extends Controller
{
    /**
     * Liste des cautions avec leurs propriétaires (Customer/Company)
     */
    public function index()
    {
        $cautions = Caution::with('owner')->latest()->get();

        // جلب الزبناء بتنسيق مناسب للـ Select
        $customers = Customer::select('id', 'name')->get()->map(fn($c) => [
            'id'    => $c->id,
            'name'  => $c->name,
            'type'  => Customer::class,
            'label' => 'Client: ' . $c->name
        ]);

        // جلب الشركات بتنسيق مناسب للـ Select
        $companies = Company::select('id', 'name')->get()->map(fn($c) => [
            'id'    => $c->id,
            'name'  => $c->name,
            'type'  => Company::class,
            'label' => 'Société: ' . $c->name
        ]);

        return Inertia::render('cautions', [
            'cautions' => $cautions,
            'owners'   => $customers->concat($companies)
        ]);
    }

    /**
     * Enregistrer une nouvelle caution ou la restaurer depuis l'archive
     */
    public function store(Request $request)
    {
        // 1. توحيد الاسم (Lowercase & Trim)
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        // 2. البحث في الأرشيف (بما في ذلك المحذوفين)
        $existingCaution = Caution::withTrashed()->where('name', $request->name)->first();

        if ($existingCaution) {
            if (!$existingCaution->trashed()) {
                {
                    return back()->withErrors(['name' => 'Cette caution existe déjà.']);
                }
            }

            // Unarchive: استرجاع الضمانة من الأرشيف وتحديث بيانات المالك
            $existingCaution->update([
                'owner_id'   => $request->owner_id,
                'owner_type' => $request->owner_type,
            ]);

            $existingCaution->restore();

            return back()->with('success', 'Caution récupérée de l\'archive avec succès ! 🛡️');
        }

        // 3. التحقق والكارنية إذا كانت جديدة كلياً
        $validated = $request->validate([
            'name'       => 'required|string|max:255|unique:cautions,name',
            'owner_id'   => 'required|integer',
            'owner_type' => 'required|string|in:App\Models\Customer,App\Models\Company',
        ], [
            'name.unique' => 'Cette caution existe déjà.',
            'name.required' => 'Le nom de la caution est obligatoire.',
        ]);

        Caution::create($validated);

        return back()->with('success', 'Caution ajoutée avec succès ! ✅');
    }

    /**
     * Mettre à jour les informations de la caution
     */
    public function update(Request $request, Caution $caution)
    {
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('cautions', 'name')
                    ->ignore($caution->id)
                    ->whereNull('deleted_at'),
            ],
            'owner_id'   => 'required|integer',
            'owner_type' => 'required|string|in:App\Models\Customer,App\Models\Company',
        ], [
            'name.unique' => 'Cette caution existe déjà.',
        ]);

        $caution->update($validated);

        return back()->with('success', 'Caution mise à jour avec succès ! ✅');
    }

    /**
     * Archiver une caution
     */
    public function destroy(Caution $caution)
    {
        // التحقق من الارتباط بالفواتير قبل الأرشفة
        $invoicesCount = $caution->invoices()->count();

        if ($invoicesCount > 0) {
            {
                return redirect()->back()->with(
                    'error',
                    "Impossible d'archiver la caution '{$caution->name}' : elle est liée à $invoicesCount facture(s)."
                );
            }
        }

        $caution->delete();

        return redirect()->back()->with('success', "La caution '{$caution->name}' a été archivée. 🗑️");
    }
}