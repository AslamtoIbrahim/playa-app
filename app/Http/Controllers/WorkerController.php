<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class WorkerController extends Controller
{
    /**
     * Liste des ouvriers
     */
    public function index()
    {
        $workers = Worker::withCount('attendances')
            ->latest()
            ->get();



        return Inertia::render('workers', [
            'workers' => $workers
        ]);
    }



    /**
     * Créer un ouvrier (ou restaurer un ancien)
     */
    public function store(Request $request)
    {
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);



        $existingWorker = Worker::withTrashed()
            ->where('name', $request->name)
            ->first();



        if ($existingWorker) {

            if (!$existingWorker->trashed()) {

                $request->validate([
                    'name' => 'unique:workers,name',
                ], [
                    'name.unique' => 'Cet ouvrier existe déjà.',
                ]);
            }



            $existingWorker->restore();

            return redirect()->back()->with('success', "L'ouvrier a été récupéré avec succès ! ♻️");
        }



        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:workers,name',
        ], [
            'name.required' => 'Le nom de l\'ouvrier est obligatoire.',
            'name.unique' => 'Cet ouvrier existe déjà.',
        ]);



        Worker::create($validated);



        return redirect()->back()->with('success', 'Ouvrier créé avec succès ! ✅');
    }



    /**
     * Mise à jour ouvrier
     */
    public function update(Request $request, Worker $worker)
    {
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);



        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('workers', 'name')->ignore($worker->id),
            ],
        ], [
            'name.unique' => 'Cet ouvrier existe déjà.',
        ]);



        $worker->update($validated);



        return redirect()->back()->with('success', 'Ouvrier mis à jour avec succès ! ✅');
    }



    /**
     * Supprimer ouvrier (soft delete)
     */
    public function destroy(Worker $worker)
    {
        $attendancesCount = $worker->attendances()->count();



        if ($attendancesCount > 0) {

            return redirect()->back()->with(
                'error',
                "Impossible de supprimer cet ouvrier : {$attendancesCount} pointage(s) existant(s)."
            );
        }



        $worker->delete();



        return redirect()->back()->with(
            'success',
            "L'ouvrier '{$worker->name}' a été supprimé. ✅"
        );
    }
}