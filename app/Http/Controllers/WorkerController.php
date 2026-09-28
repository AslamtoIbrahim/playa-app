<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'workers' => $workers,
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

            if (! $existingWorker->trashed()) {

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
     * Enregistrer plusieurs ouvriers d'un coup (Bulk).
     * Les doublons existants sont ignorés et les ouvriers archivés sont restaurés.
     */
    public function bulkStore(Request $request)
    {
        // 1. توحيد السمية + حذف الفراغات + إزالة التكرار داخل نفس اللائحة
        $request->merge([
            'names' => collect($request->input('names', []))
                ->map(fn ($name) => strtolower(trim((string) $name)))
                ->filter()
                ->unique()
                ->values()
                ->all(),
        ]);

        // 2. التحقق من صحة اللائحة كاملة
        $validated = $request->validate([
            'names' => 'required|array|min:1',
            'names.*' => 'required|string|max:255',
        ], [
            'names.required' => 'Ajoutez au moins un nom d\'ouvrier.',
            'names.min' => 'Ajoutez au moins un nom d\'ouvrier.',
            'names.*.required' => 'Le nom de l\'ouvrier est obligatoire.',
            'names.*.max' => 'Le nom de l\'ouvrier ne peut pas dépasser 255 caractères.',
        ]);

        $created = 0;
        $restored = 0;
        $skipped = 0;

        // 3. المعالجة داخل Transaction وحدة
        DB::transaction(function () use ($validated, &$created, &$restored, &$skipped) {
            foreach ($validated['names'] as $name) {
                $existingWorker = Worker::withTrashed()->where('name', $name)->first();

                // مالقيناش السمية -> إنشاء جديد
                if (! $existingWorker) {
                    Worker::create(['name' => $name]);
                    $created++;

                    continue;
                }

                // كاينة ولكن ممسوحة (archivée) -> Restore
                if ($existingWorker->trashed()) {
                    $existingWorker->restore();
                    $restored++;

                    continue;
                }

                // كاينة و نشيطة -> كنتجاهلوها باش ما نكرهوش Doublons
                $skipped++;
            }
        });

        $message = collect([
            $created > 0 ? "{$created} ouvrier(s) créé(s)" : null,
            $restored > 0 ? "{$restored} restauré(s)" : null,
            $skipped > 0 ? "{$skipped} ignoré(s) (déjà existants)" : null,
        ])->filter()->implode(', ');

        return redirect()->back()->with(
            'success',
            $message !== '' ? "{$message} ! ✅" : 'Aucune modification apportée.'
        );
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
