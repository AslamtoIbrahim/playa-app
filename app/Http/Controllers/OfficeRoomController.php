<?php

namespace App\Http\Controllers;

use App\Models\OfficeRoom;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OfficeRoomController extends Controller
{
    public function index()
    {
        return Inertia::render('office-rooms', [
            'officeRooms' => OfficeRoom::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'nullable|string|max:255',
        ]);

        OfficeRoom::create($validated);

        return redirect()->back()->with('success', 'Office Room created!');
    }

    public function update(Request $request, OfficeRoom $officeRoom)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'nullable|string|max:255',
        ]);

        $officeRoom->update($validated);

        return redirect()->back()->with('success', 'Office Room updated!');
    }

    /**
     * أرشفة مكتب (OfficeRoom)
     */
    public function destroy(OfficeRoom $officeRoom)
    {
        // 1. تشيك واش هاد المكتب مرتبط بشي فواتير (Invoices)
        // خاص تكون عندك علاقة invoices() فـ الموديل OfficeRoom
        $invoicesCount = $officeRoom->invoices()->count();

        // 2. المنع إذا كان المكتب "عامر" بالعمليات المالية
        if ($invoicesCount > 0) {
            return redirect()->back()->with(
                'error',
                "Impossible d'archiver le bureau '{$officeRoom->name}' : il contient $invoicesCount facture(s) active(s)."
            );
        }

        // 3. الأرشفة (Soft Delete)
        $officeRoom->delete();

        return redirect()->back()->with('success', "Le bureau '{$officeRoom->name}' a été archivé avec succès. 🏢");
    }
}
