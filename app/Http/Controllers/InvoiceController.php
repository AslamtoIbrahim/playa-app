<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Boat;
use App\Models\Invoice;
use App\Models\Item; // هادا الموديل ديال السلعة (الأنواع)
use App\Models\OfficeRoom;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * عرض قائمة الفواتير
     */
    public function index()
    {
        // زدنا الحقول المهمة في الـ select باش نأكدو وجودهم
        $invoices = Invoice::with(['account', 'officeRoom'])
            ->latest()
            ->withSum('payments as total_paid', 'amount')
            ->select('id', 'invoice_number', 'date', 'account_id', 'office_room_id', 'status', 'amount', 'tva', 'boxes', 'weight')
            ->paginate(10);

        $accounts = Account::all(['id', 'name']);
        $officeRooms = OfficeRoom::all(['id', 'name', 'city']);

        return inertia('invoices', [
            'invoices'    => $invoices,
            'accounts'    => $accounts,
            'officeRooms' => $officeRooms
        ]);
    }

    /**
     * تسجيل فاتورة جديدة (الغلاف فقط بـ 0 درهم)
     */
    public function store(Request $request)
    {
        // 1. Validation ديال الحقول اللي كاينين فـ الـ Dialog
        $validated = $request->validate([
            'date'           => 'required|date',
            'account_id'     => 'required|exists:accounts,id',
            'office_room_id' => 'required|exists:office_rooms,id',
        ]);

        // 2. كنسجلو الفاتورة
        // ملاحظة: invoice_number والمبالغ (0) كيتكلف بيهم الـ boot() فـ الموديل
        $invoice = Invoice::create([
            'date'           => $validated['date'],
            'account_id'     => $validated['account_id'],
            'office_room_id' => $validated['office_room_id'],
            'created_by'     => $request->user()->id,
            'status'         => 'unpaid',
            'tva'            => 0,
            'boxes'          => 0,
            'amount'         => 0,
            'weight'         => 0,
        ]);

        // كندويه لصفحة التفاصيل باش يبدا يعمر الـ Items والمراكب
        return redirect()->route('invoices.show', $invoice->id)
            ->with('success', 'Invoice created! Add items and boats now.');
    }

    /**
     * عرض تفاصيل فاتورة (الجدول الداخلي)
     */
    public function show(Invoice $invoice)
    {
        // كنحملو العلاقات كاملة باش تبان فـ صفحة التفاصيل
        $invoice->load(['account', 'officeRoom', 'items.item', 'items.boat']);

        return inertia('show', [
            'invoice' => $invoice,
            'boats'   => Boat::all(['id', 'name']), // باش يختار المركب فـ كل سطر
            'items'   => Item::all(['id', 'name']), // باش يختار نوع السلعة فـ كل سطر
        ]);
    }

    /**
     * تحديث المعلومات الأساسية (Date, Account, الخ)
     */
    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'date'           => 'required|date',
            'account_id'     => 'required|exists:accounts,id',
            // 'office_room_id' => 'required|exists:office_rooms,id',
            // 'status'         => 'required|string',
        ]);

        $invoice->update($validated);

        return back()->with('success', 'Invoice updated!');
    }

    /**
     * أرشفة فاتورة (اعتماداً على الـ amount الموجود في الجدول)
     */
    public function destroy(Invoice $invoice)
    {
        // 1. نشيكو مباشرة على الـ column اللي سميتو amount
        // إذا كان كبر من 0، يعني الفاتورة فيها مبالغ مالية وممنوع تمسح
        if ($invoice->amount > 0) {
            return redirect()->back()->with(
                'error',
                "Action interdite : Cette facture (#{$invoice->invoice_number}) a un montant de " . number_format($invoice->amount, 2) . " DH. 
            Veuillez la vider ou l'annuler avant de l'archiver."
            );
        }

        try {
            // 2. أرشفة الـ items المرتبطين بالفاتورة (باش يبقاو مخبيين مع الفاتورة)
            $invoice->items()->delete();

            // 3. أرشفة الفاتورة نفسها (Soft Delete)
            $invoice->delete();

            return redirect()->back()->with('success', "La facture #{$invoice->invoice_number} a été archivée avec succès. 🗑️");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Une erreur est survenue lors de l'archivage.");
        }
    }
}
