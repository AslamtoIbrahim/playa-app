<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
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
            'customers' => $customers
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
            if (!$existingCustomer->trashed()) {
                $request->validate([
                    'name' => 'unique:customers,name',
                ], [
                    'name.unique' => 'Ce client existe déjà.',
                ]);
            }

            // إيلا وصل هنا يعني السجل ممسوح (trashed) -> نديرو ليه Restore
            $existingCustomer->restore();

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

        // منع الأرشفة إيلا كان مرتبط بداتا
        if ($invoicesCount > 0 || $boatsCount > 0) {
            $message = "Impossible d'archiver ce compte : ";
            $reasons = [];

            if ($boatsCount > 0) $reasons[] = "$boatsCount bateau(x)";
            if ($invoicesCount > 0) $reasons[] = "$invoicesCount facture(s)";

            return redirect()->back()->with('error', $message . implode(' et ', $reasons) . '.');
        }

        $customer->delete();

        return redirect()->back()->with('success', "Le compte '{$customer->name}' a été archivé. ✅");
    }
}