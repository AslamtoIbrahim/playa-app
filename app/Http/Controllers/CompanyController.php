<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CompanyController extends Controller
{
    /**
     * Liste des sociétés.
     */
    public function index()
    {
        $companies = Company::withCount(['invoices', 'boats'])->latest()->get();

        return Inertia::render('companies', [
            'companies' => $companies,
        ]);
    }

    /**
     * Enregistrer ou restaurer une société.
     */
    public function store(Request $request)
    {
        // توحيد السمية قبل كل شيء
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        // 1. البحث في الداتابيز بما في ذلك الشركات المأرشفة (Trashed)
        $existingCompany = Company::withTrashed()->where('name', $request->name)->first();

        if ($existingCompany) {
            // إيلا كانت الشركة موجودة وغير ممسوحة -> خطأ (تكرار)
            if (! $existingCompany->trashed()) {
                return back()->withErrors(['name' => 'Cette société existe déjà.']);
            }

            // إيلا كانت في الأرشيف -> رجعها (Restore)
            $existingCompany->restore();

            return redirect()->back()->with('success', 'La société a été récupérée de l\'archive ! ♻️');
        }

        // 2. إيلا كانت شركة جديدة كليا -> Validation عادي
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:companies,name',
        ], [
            'name.unique' => 'Cette société existe déjà.',
            'name.required' => 'Le nom de la société est obligatoire.',
        ]);

        Company::create($validated);

        return redirect()->back()->with('success', 'Société créée avec succès ! ✅');
    }

    /**
     * Enregistrer plusieurs sociétés d'un coup (Bulk).
     * Les doublons existants sont ignorés et les sociétés archivées sont restaurées.
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
            'names.required' => 'Ajoutez au moins un nom de société.',
            'names.min' => 'Ajoutez au moins un nom de société.',
            'names.*.required' => 'Le nom de la société est obligatoire.',
            'names.*.max' => 'Le nom de la société ne peut pas dépasser 255 caractères.',
        ]);

        $created = 0;
        $restored = 0;
        $skipped = 0;

        // 3. المعالجة داخل Transaction وحدة
        DB::transaction(function () use ($validated, &$created, &$restored, &$skipped) {
            foreach ($validated['names'] as $name) {
                $existingCompany = Company::withTrashed()->where('name', $name)->first();

                // مالقيناش السمية -> إنشاء جديد
                if (! $existingCompany) {
                    Company::create(['name' => $name]);
                    $created++;

                    continue;
                }

                // كاينة ولكن ممسوحة (archivée) -> Restore
                if ($existingCompany->trashed()) {
                    $existingCompany->restore();
                    $restored++;

                    continue;
                }

                // كاينة و نشيطة -> كنتجاهلوها باش ما نكرهوش Doublons
                $skipped++;
            }
        });

        $message = collect([
            $created > 0 ? "{$created} société(s) créée(s)" : null,
            $restored > 0 ? "{$restored} restaurée(s)" : null,
            $skipped > 0 ? "{$skipped} ignorée(s) (déjà existantes)" : null,
        ])->filter()->implode(', ');

        return redirect()->back()->with('success', $message.'. ✅');
    }

    /**
     * Mettre à jour les informations de la société.
     */
    public function update(Request $request, Company $company)
    {
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                // تجاهل الشركة الحالية، ولكن تأكد من عدم التكرار مع شركات أخرى (غير ممسوحة)
                Rule::unique('companies', 'name')
                    ->ignore($company->id)
                    ->whereNull('deleted_at'),
            ],
        ], [
            'name.unique' => 'Cette société existe déjà.',
        ]);

        $company->update($validated);

        return redirect()->back()->with('success', 'Société mise à jour avec succès ! ✅');
    }

    /**
     * Archiver une société.
     */
    public function destroy(Company $company)
    {
        $invoicesCount = $company->invoices()->count();
        $boatsCount = $company->boats()->count();

        // منع الحذف إيلا كانت كاين داتا مربوطة
        if ($invoicesCount > 0 || $boatsCount > 0) {
            $reasons = [];
            if ($boatsCount > 0) {
                $reasons[] = "$boatsCount bateau(x)";
            }
            if ($invoicesCount > 0) {
                $reasons[] = "$invoicesCount facture(s)";
            }

            return redirect()->back()->with('error', "Impossible d'archiver : liée à ".implode(' et ', $reasons).'.');
        }

        $company->delete();

        return redirect()->back()->with('success', "La société '{$company->name}' a été archivée. ✅");
    }
}
