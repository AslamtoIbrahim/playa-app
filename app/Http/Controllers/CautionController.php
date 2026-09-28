<?php

namespace App\Http\Controllers;

use App\Models\Caution;
use App\Models\Company;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $customers = Customer::select('id', 'name')->get()->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'type' => Customer::class,
            'label' => 'Client: '.$c->name,
        ]);

        // جلب الشركات بتنسيق مناسب للـ Select
        $companies = Company::select('id', 'name')->get()->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'type' => Company::class,
            'label' => 'Société: '.$c->name,
        ]);

        return Inertia::render('cautions', [
            'cautions' => $cautions,
            'owners' => $customers->concat($companies),
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
            if (! $existingCaution->trashed()) {

                return back()->withErrors(['name' => 'Cette caution existe déjà.']);

            }

            // Unarchive: استرجاع الضمانة من الأرشيف وتحديث بيانات المالك
            $existingCaution->update([
                'owner_id' => $request->owner_id,
                'owner_type' => $request->owner_type,
            ]);

            $existingCaution->restore();

            return back()->with('success', 'Caution récupérée de l\'archive avec succès ! 🛡️');
        }

        // 3. التحقق والكارنية إذا كانت جديدة كلياً
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:cautions,name',
            'owner_id' => 'required|integer',
            'owner_type' => 'required|string|in:App\Models\Customer,App\Models\Company',
        ], [
            'name.unique' => 'Cette caution existe déjà.',
            'name.required' => 'Le nom de la caution est obligatoire.',
        ]);

        Caution::create($validated);

        return back()->with('success', 'Caution ajoutée avec succès ! ✅');
    }

    /**
     * Enregistrer plusieurs cautions d'un coup (Bulk), chacune avec son propriétaire.
     * Les doublons existants sont ignorés et les cautions archivées sont restaurées.
     */
    public function bulkStore(Request $request)
    {
        // 1. تنظيف الداتا: توحيد السمية، حذف الأسطر الفارغة، وإزالة التكرار داخل نفس اللائحة
        $request->merge([
            'cautions' => collect($request->input('cautions', []))
                ->filter(fn ($caution) => is_array($caution))
                ->map(fn ($caution) => [
                    'name' => strtolower(trim((string) ($caution['name'] ?? ''))),
                    'owner_id' => $caution['owner_id'] ?? null,
                    'owner_type' => $caution['owner_type'] ?? null,
                ])
                ->reject(fn ($caution) => $caution['name'] === '' && blank($caution['owner_id']) && blank($caution['owner_type']))
                ->unique(fn ($caution) => $caution['name'])
                ->values()
                ->all(),
        ]);

        // 2. التحقق من صحة اللائحة كاملة
        $validated = $request->validate([
            'cautions' => 'required|array|min:1',
            'cautions.*.name' => 'required|string|max:255',
            'cautions.*.owner_id' => 'required|integer',
            'cautions.*.owner_type' => 'required|string|in:App\Models\Customer,App\Models\Company',
        ], [
            'cautions.required' => 'Ajoutez au moins une caution.',
            'cautions.min' => 'Ajoutez au moins une caution.',
            'cautions.*.name.required' => 'Le nom de la caution est obligatoire.',
            'cautions.*.name.max' => 'Le nom de la caution ne peut pas dépasser 255 caractères.',
            'cautions.*.owner_id.required' => 'Veuillez choisir un propriétaire.',
            'cautions.*.owner_type.required' => 'Le type de propriétaire est obligatoire.',
            'cautions.*.owner_type.in' => 'Le type de propriétaire est invalide.',
        ]);

        $created = 0;
        $restored = 0;
        $skipped = 0;

        // 3. المعالجة داخل Transaction وحدة
        DB::transaction(function () use ($validated, &$created, &$restored, &$skipped) {
            foreach ($validated['cautions'] as $row) {
                $existingCaution = Caution::withTrashed()->where('name', $row['name'])->first();

                // مالقيناش السمية -> إنشاء جديد
                if (! $existingCaution) {
                    Caution::create([
                        'name' => $row['name'],
                        'owner_id' => $row['owner_id'],
                        'owner_type' => $row['owner_type'],
                    ]);

                    $created++;

                    continue;
                }

                // كان ف الأرشيف (Trashed) -> نرجعوه ونحدثو المالك ديالو
                if ($existingCaution->trashed()) {
                    $existingCaution->update([
                        'owner_id' => $row['owner_id'],
                        'owner_type' => $row['owner_type'],
                    ]);

                    $existingCaution->restore();

                    $restored++;

                    continue;
                }

                // كاين و نشيط -> كيتجاهل
                $skipped++;
            }
        });

        $message = collect([
            $created > 0 ? "{$created} caution(x) créé(s)" : null,
            $restored > 0 ? "{$restored} restaurée(s) depuis l'archive" : null,
            $skipped > 0 ? "{$skipped} ignorée(s) (déjà existantes)" : null,
        ])->filter()->implode(', ');

        return redirect()->back()->with('success', $message.'. ✅');
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
            'owner_id' => 'required|integer',
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

            return redirect()->back()->with(
                'error',
                "Impossible d'archiver la caution '{$caution->name}' : elle est liée à $invoicesCount facture(s)."
            );

        }

        $caution->delete();

        return redirect()->back()->with('success', "La caution '{$caution->name}' a été archivée. 🗑️");
    }
}
