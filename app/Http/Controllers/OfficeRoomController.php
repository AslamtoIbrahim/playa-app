<?php

namespace App\Http\Controllers;

use App\Models\OfficeRoom;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OfficeRoomController extends Controller
{
    public function index()
    {
        return Inertia::render('office-rooms', [
            'officeRooms' => OfficeRoom::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        // 1. توحيد الـ city لـ lowercase
        $request->merge([
            'city' => strtolower(trim($request->city)),
        ]);

        // 2. البحث في الأرشيف (بما في ذلك المحذوفين)
        $existingRoom = OfficeRoom::withTrashed()->where('city', $request->city)->first();

        if ($existingRoom) {
            if (!$existingRoom->trashed()) {
                // تكرار حقيقي: المدينة موجودة وخدامة
                return back()->withErrors(['city' => 'Ce bureau (ville) existe déjà.']);
            }

            // المدينة موجودة ولكن مأرشفة: نديرو ليها Unarchive
            $existingRoom->update(['name' => $request->name]); // تحديث الاسم إيلا تبدل
            $existingRoom->restore();

            return redirect()->back()->with('success', 'Le bureau a été récupéré de l\'archive avec succès ! ♻️');
        }

        // 3. إيلا ما كايناش نهائيا: Validation و Create
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255|unique:office_rooms,city',
        ], [
            'city.unique' => 'Ce bureau (ville) existe déjà.',
            'city.required' => 'La ville est obligatoire.',
        ]);

        OfficeRoom::create($validated);

        return redirect()->back()->with('success', 'Bureau créé avec succès ! ✨');
    }

    public function update(Request $request, OfficeRoom $officeRoom)
    {
        $request->merge([
            'city' => strtolower(trim($request->city)),
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => [
                'required',
                'string',
                'max:255',
                Rule::unique('office_rooms', 'city')->ignore($officeRoom->id),
            ],
        ], [
            'city.unique' => 'Ce bureau (ville) existe déjà.',
        ]);

        $officeRoom->update($validated);

        return redirect()->back()->with('success', 'Bureau mis à jour avec succès ! 🔄');
    }

    public function destroy(OfficeRoom $officeRoom)
    {
        $invoicesCount = $officeRoom->invoices()->count();

        if ($invoicesCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver le bureau '{$officeRoom->name}' : il contient $invoicesCount facture(s)."
            );
        }

        $officeRoom->delete();

        return redirect()->back()->with('success', "Le bureau '{$officeRoom->name}' a été archivé. 🏢");
    }
}