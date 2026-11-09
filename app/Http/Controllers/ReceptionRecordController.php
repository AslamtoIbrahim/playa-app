<?php

namespace App\Http\Controllers;

use App\Models\ReceptionRecord;
use App\Models\Usine;
use Illuminate\Http\Request;

class ReceptionRecordController extends Controller
{
    public function store(Request $request, Usine $usine)
    {
        $validated = $request->validate([
            'session_id' => ['required', 'integer', 'exists:daily_sessions,id'],
            'sale_item_id' => ['nullable', 'integer', 'exists:sale_items,id'],
            'weight' => ['required', 'numeric', 'min:0'],
            'ttc' => ['required', 'numeric', 'min:0'],
            'amount' => ['required', 'numeric', 'min:0'],
            'margin_percentage' => ['required', 'numeric', 'min:0'],
            'invoice_reference' => ['nullable', 'integer', 'min:0'],
        ]);

        $usine->receptionRecords()->create($validated);

        return redirect()->back()->with('success', 'Réception ajoutée avec succès.');
    }

    public function update(Request $request, Usine $usine, ReceptionRecord $receptionRecord)
    {
        abort_unless($receptionRecord->usine_id === $usine->id, 404);

        $validated = $request->validate([
            'session_id' => ['required', 'integer', 'exists:daily_sessions,id'],
            'sale_item_id' => ['nullable', 'integer', 'exists:sale_items,id'],
            'weight' => ['required', 'numeric', 'min:0'],
            'ttc' => ['required', 'numeric', 'min:0'],
            'amount' => ['required', 'numeric', 'min:0'],
            'margin_percentage' => ['required', 'numeric', 'min:0'],
            'invoice_reference' => ['nullable', 'integer', 'min:0'],
        ]);

        $receptionRecord->update($validated);

        return redirect()->back()->with('success', 'Réception mise à jour avec succès.');
    }

    public function destroy(Usine $usine, ReceptionRecord $receptionRecord)
    {
        abort_unless($receptionRecord->usine_id === $usine->id, 404);

        $receptionRecord->delete();

        return redirect()->back()->with('success', 'Réception supprimée avec succès.');
    }
}
