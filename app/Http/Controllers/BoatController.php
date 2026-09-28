<?php

namespace App\Http\Controllers;

use App\Models\Boat;
use App\Models\Company;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
     * Enregistrer plusieurs bateaux d'un coup (Bulk), chacun avec son propriétaire.
     * Les doublons existants sont ignorés et les bateaux archivés sont restaurés.
     */
    public function bulkStore(Request $request)
    {
        // 1. تنظيف الداتا: توحيد السمية، حذف الأسطر الفارغة، وإزالة التكرار داخل نفس اللائحة
        $request->merge([
            'boats' => collect($request->input('boats', []))
                ->filter(fn ($boat) => is_array($boat))
                ->map(fn ($boat) => [
                    'name' => strtolower(trim((string) ($boat['name'] ?? ''))),
                    'owner_id' => $boat['owner_id'] ?? null,
                    'owner_type' => $boat['owner_type'] ?? null,
                ])
                ->reject(fn ($boat) => $boat['name'] === '' && blank($boat['owner_id']) && blank($boat['owner_type']))
                ->unique(fn ($boat) => $boat['name'])
                ->values()
                ->all(),
        ]);

        // 2. التحقق من صحة اللائحة كاملة
        $validated = $request->validate([
            'boats' => 'required|array|min:1',
            'boats.*.name' => 'required|string|max:255',
            'boats.*.owner_id' => 'required|integer',
            'boats.*.owner_type' => 'required|string|in:App\Models\Customer,App\Models\Company',
        ], [
            'boats.required' => 'Ajoutez au moins un bateau.',
            'boats.min' => 'Ajoutez au moins un bateau.',
            'boats.*.name.required' => 'Le nom du bateau est obligatoire.',
            'boats.*.name.max' => 'Le nom du bateau ne peut pas dépasser 255 caractères.',
            'boats.*.owner_id.required' => 'Veuillez choisir un propriétaire.',
            'boats.*.owner_type.required' => 'Le type de propriétaire est obligatoire.',
            'boats.*.owner_type.in' => 'Le type de propriétaire est invalide.',
        ]);

        $created = 0;
        $restored = 0;
        $skipped = 0;

        // 3. المعالجة داخل Transaction وحدة
        DB::transaction(function () use ($validated, &$created, &$restored, &$skipped) {
            foreach ($validated['boats'] as $row) {
                $existingBoat = Boat::withTrashed()->where('name', $row['name'])->first();

                // مالقيناش السمية -> إنشاء جديد
                if (! $existingBoat) {
                    Boat::create([
                        'name' => $row['name'],
                        'owner_id' => $row['owner_id'],
                        'owner_type' => $row['owner_type'],
                    ]);

                    $created++;

                    continue;
                }

                // كان ف الأرشيف (Trashed) -> نرجعوه ونحدثو المالك ديالو
                if ($existingBoat->trashed()) {
                    $existingBoat->update([
                        'owner_id' => $row['owner_id'],
                        'owner_type' => $row['owner_type'],
                    ]);

                    $existingBoat->restore();

                    $restored++;

                    continue;
                }

                // كاين و نشيط -> كيتجاهل
                $skipped++;
            }
        });

        $message = collect([
            $created > 0 ? "{$created} bateau(x) créé(s)" : null,
            $restored > 0 ? "{$restored} restauré(s) depuis l'archive" : null,
            $skipped > 0 ? "{$skipped} ignoré(s) (déjà existants)" : null,
        ])->filter()->implode(', ');

        return redirect()->back()->with('success', $message.'. ✅');
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