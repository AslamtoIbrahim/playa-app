<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ZoneController extends Controller
{
    public function index()
    {
        return Inertia::render('zones', [
            'zones' => Zone::latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        // 1. توحيد الـ name (حذف الفراغات الزائدة)
        $request->merge([
            'name' => trim($request->name),
        ]);

        // 2. البحث في الأرشيف (بما في ذلك المحذوفين)
        $existingZone = Zone::withTrashed()->where('name', $request->name)->first();

        if ($existingZone) {
            if (!$existingZone->trashed()) {
                // تكرار حقيقي: المنطقة موجودة وخدّامة
                return back()->withErrors(['name' => 'Cette zone existe déjà.']);
            }

            // المنطقة موجودة ولكن مأرشفة: نديرو ليها Restore
            $existingZone->restore();

            return redirect()->back()->with('success', 'La zone a été récupérée de l\'archive avec succès ! ♻️');
        }

        // 3. إيلا ما كايناش نهائيا: Validation و Create
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:zones,name',
        ], [
            'name.unique' => 'Cette zone existe déjà.',
            'name.required' => 'Le nom de la zone est obligatoire.',
        ]);

        Zone::create($validated);

        return redirect()->back()->with('success', 'Zone créée avec succès ! ✨');
    }

    public function update(Request $request, Zone $zone)
    {
        $request->merge([
            'name' => trim($request->name),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('zones', 'name')->ignore($zone->id),
            ],
        ], [
            'name.unique' => 'Cette zone existe déjà.',
        ]);

        $zone->update($validated);

        return redirect()->back()->with('success', 'Zone mise à jour avec succès ! 🔄');
    }

    public function destroy(Zone $zone)
    {
        // التحقق واش المنطقة مرتبطة بـ SessionZones (بما أننا خدمنا بالـ Pivot Table)
        // ملاحظة: خاصك تزيد علاقة sessionZones() في الموديل Zone
        $usageCount = $zone->sessionZones()->count();

        if ($usageCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver la zone '{$zone->name}' : elle est déjà utilisée dans $usageCount session(s)."
            );
        }

        $zone->delete();

        return redirect()->back()->with('success', "La zone '{$zone->name}' a été archivée. 📁");
    }
}