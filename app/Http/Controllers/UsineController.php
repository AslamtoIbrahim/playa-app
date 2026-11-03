<?php

namespace App\Http\Controllers;

use App\Models\Usine;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UsineController extends Controller
{
    public function index()
    {
        return Inertia::render('usine', [
            'usines' => Usine::latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ], [
            'name.required' => 'Le nom de l’usine est obligatoire.',
        ]);

        Usine::create($validated);

        return redirect()->back()->with('success', 'Usine créée avec succès !');
    }

    public function update(Request $request, Usine $usine)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ], [
            'name.required' => 'Le nom de l’usine est obligatoire.',
        ]);

        $usine->update($validated);

        return redirect()->back()->with('success', 'Usine mise à jour avec succès !');
    }

    public function destroy(Usine $usine)
    {
        $usine->delete();

        return redirect()->back()->with('success', 'Usine supprimée avec succès !');
    }
}
