<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Liste des clients avec le compte de leurs factures et bateaux.
     */
    public function index()
    {
        $customers = Customer::withCount(['invoices', 'boats'])->latest()->get();

        return Inertia::render('customers', [
            'customers' => $customers,
        ]);
    }

    /**
     * Enregistrer un nouveau client ou restaurer un ancien.
     */
    public function store(Request $request)
    {
        // 1. توحيد السمية (Lowercase + Trim)
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        // 2. التحقق واش كاين ف الأرشيف (بما في ذلك السجلات الممسوحة soft deleted)
        $existingCustomer = Customer::withTrashed()->where('name', $request->name)->first();

        if ($existingCustomer) {
            // إيلا كان كاين وما ممسوحش -> نطبقو الـ Validation العادي باش يعطي Error Unique
            if (! $existingCustomer->trashed()) {
                $request->validate([
                    'name' => 'unique:customers,name',
                ], [
                    'name.unique' => 'Ce client existe déjà.',
                ]);
            }

            // إيلا وصل هنا يعني السجل ممسوح (trashed) -> نديرو ليه Restore
            $existingCustomer->restore();

            $existingCustomer->refresh();

            return redirect()->back()->with('success', 'Le client a été récupéré de l\'archive avec succès ! ♻️');
        }

        // 3. إيلا مالقاهش نهائيا، نكريوه عادي
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:customers,name',
        ], [
            'name.unique' => 'Ce client existe déjà.',
            'name.required' => 'Le nom du client est obligatoire.',
        ]);

        Customer::create($validated);

        return redirect()->back()->with('success', 'Client créé avec succès ! ✅');
    }

    /**
     * Enregistrer plusieurs clients d'un coup (Bulk).
     * Les doublons existants sont ignorés et les clients archivés sont restaurés.
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
            'names.required' => 'Ajoutez au moins un nom de client.',
            'names.min' => 'Ajoutez au moins un nom de client.',
            'names.*.required' => 'Le nom du client est obligatoire.',
            'names.*.max' => 'Le nom du client ne peut pas dépasser 255 caractères.',
        ]);

        $created = 0;
        $restored = 0;
        $skipped = 0;

        // 3. المعالجة داخل Transaction وحدة
        DB::transaction(function () use ($validated, &$created, &$restored, &$skipped) {
            foreach ($validated['names'] as $name) {
                $existingCustomer = Customer::withTrashed()->where('name', $name)->first();

                // مالقيناش السمية -> إنشاء جديد
                if (! $existingCustomer) {
                    Customer::create(['name' => $name]);
                    $created++;

                    continue;
                }

                // كاين ولكن ممسوح (archivé) -> Restore
                if ($existingCustomer->trashed()) {
                    $existingCustomer->restore();
                    $restored++;

                    continue;
                }

                // كاين و نشيط -> كنتجاهلوه باش ما نكرهوش Doublons
                $skipped++;
            }
        });

        $message = collect([
            $created > 0 ? "{$created} client(s) créé(s)" : null,
            $restored > 0 ? "{$restored} restauré(s)" : null,
            $skipped > 0 ? "{$skipped} ignoré(s) (déjà existants)" : null,
        ])->filter()->implode(', ');

        return redirect()->back()->with('success', $message.'. ✅');
    }

    /**
     * Mettre à jour les informations du client.
     */
    public function update(Request $request, Customer $customer)
    {
        $request->merge([
            'name' => strtolower(trim($request->name)),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                // كنتأكدو بلي السمية فريدة من غير هاد الـ ID
                // ملاحظة: إيلا بغيتي الـ update حتى هو يمنعك تختار سمية كاينة ف الأرشيف
                // خاصك تزيد whereNull('deleted_at') هنا
                Rule::unique('customers', 'name')->ignore($customer->id),
            ],
        ], [
            'name.unique' => 'Ce client existe déjà.',
        ]);

        $customer->update($validated);

        return redirect()->back()->with('success', 'Client mis à jour avec succès ! ✅');
    }

    /**
     * Archiver/Supprimer un compte client (Soft Delete).
     */
    public function destroy(Customer $customer)
    {
        $invoicesCount = $customer->invoices()->count();
        $boatsCount = $customer->boats()->count();
        $receiptsCount = $customer->receipts()->count();
        $differencesCount = $customer->differences()->count();
        $salesCount = $customer->sales()->count();

        // منع الأرشفة إيلا كان مرتبط بأي داتا (حفاظا على سلامة المعطيات)
        if ($invoicesCount > 0 || $boatsCount > 0 || $receiptsCount > 0 || $differencesCount > 0 || $salesCount > 0) {
            $reasons = [];

            if ($receiptsCount > 0) {
                $reasons[] = "$receiptsCount bon(s)/reçu(s)";
            }
            if ($invoicesCount > 0) {
                $reasons[] = "$invoicesCount facture(s)";
            }
            if ($boatsCount > 0) {
                $reasons[] = "$boatsCount bateau(x)";
            }
            if ($differencesCount > 0) {
                $reasons[] = "$differencesCount différence(s)";
            }
            if ($salesCount > 0) {
                $reasons[] = "$salesCount vente(s)";
            }

            return redirect()->back()->with('error', "Impossible d'archiver ce compte : lié à ".implode(', ', $reasons).'.');
        }

        $customer->delete();

        return redirect()->back()->with('success', "Le compte '{$customer->name}' a été archivé. ✅");
    }
}
