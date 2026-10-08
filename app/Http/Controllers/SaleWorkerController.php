<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Sale;
use App\Models\SaleWorker;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Imputation des salaires de pointage vers les ventes.
 */
class SaleWorkerController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'attendance_id' => 'required|exists:attendances,id',
            'amount' => 'required|numeric|min:0.01',
        ], [
            'sale_id.required' => 'Veuillez choisir une vente.',
            'sale_id.exists' => "Cette vente n'existe pas.",
            'attendance_id.required' => 'Le pointage est obligatoire.',
            'attendance_id.exists' => "Ce pointage n'existe pas.",
            'amount.required' => 'Le montant est obligatoire.',
            'amount.numeric' => 'Le montant doit être un nombre.',
            'amount.min' => 'Le montant doit être au moins 0.01.',
        ]);

        return DB::transaction(function () use ($validated) {
            $sale = Sale::findOrFail($validated['sale_id']);
            $attendance = Attendance::with('sessionZone')->lockForUpdate()->findOrFail($validated['attendance_id']);
            $attendanceSessionId = $attendance->sessionZone?->daily_session_id;

            if ($attendanceSessionId === null || (int) $sale->session_id !== (int) $attendanceSessionId) {
                return back()->with('error', 'La vente doit appartenir à la même journée que le pointage.');
            }

            if ($sale->session?->status === 'closed') {
                return back()->with('error', 'Action impossible : La session est clôturée.');
            }

            $exists = SaleWorker::where('sale_id', $sale->id)->where('attendance_id', $attendance->id)->exists();

            if ($exists) {
                return back()->with('error', 'Ce pointage est déjà imputé à cette vente.');
            }

            SaleWorker::onlyTrashed()
                ->where('sale_id', $sale->id)
                ->where('attendance_id', $attendance->id)
                ->forceDelete();

            $distributed = (float) $attendance->saleWorkers()->sum('amount');
            $remaining = (float) $attendance->total_wage - $distributed;

            if ($remaining <= 0) {
                return back()->with('error', 'Ce pointage est entièrement réparti.');
            }

            if ((float) $validated['amount'] > $remaining) {
                return back()->with('error', "Montant insuffisant ! Max: $remaining");
            }

            try {
                $attendance->saleWorkers()->create([
                    'sale_id' => $sale->id,
                    'amount' => $validated['amount'],
                ]);
            } catch (QueryException $e) {
                return back()->with('error', 'Ce pointage est déjà imputé à cette vente.');
            }

            return back()->with([
                'success' => 'Salaire imputé à la vente !',
                'updated_attendance' => $attendance->fresh()->load('saleWorkers.sale.customer'),
            ]);
        });
    }

    public function update(Request $request, SaleWorker $saleWorker)
    {
        $validated = $request->validate([
            'sale_id' => 'sometimes|integer|exists:sales,id',
            'attendance_id' => 'sometimes|integer|exists:attendances,id',
            'amount' => 'nullable|numeric|min:0.01',
        ], [
            'sale_id.integer' => "L'identifiant de vente est invalide.",
            'sale_id.exists' => "Cette vente n'existe pas.",
            'attendance_id.integer' => "L'identifiant de pointage est invalide.",
            'attendance_id.exists' => "Ce pointage n'existe pas.",
            'amount.numeric' => 'Le montant doit être un nombre.',
            'amount.min' => 'Le montant doit être au moins 0.01.',
        ]);

        return DB::transaction(function () use ($validated, $saleWorker) {
            $previousAttendanceId = (int) $saleWorker->attendance_id;
            $targetAttendanceId = isset($validated['attendance_id']) ? (int) $validated['attendance_id'] : null;
            $finalAttendanceId = $targetAttendanceId ?? $previousAttendanceId;
            $changesAttendance = $targetAttendanceId !== null && $targetAttendanceId !== $previousAttendanceId;

            // Row lock on the (possibly new) attendance: concurrent submissions
            // cannot exceed the wage available on that attendance.
            $attendance = Attendance::with('sessionZone')->lockForUpdate()->find($finalAttendanceId);

            if ($attendance === null) {
                return back()->with('error', "Ce pointage n'existe pas.");
            }

            $newAmount = isset($validated['amount']) ? (float) $validated['amount'] : (float) $saleWorker->amount;

            // Available = total_wage - the other allocations. On the same
            // attendance the current amount is temporarily returned to the
            // available pool; on a newly selected attendance nothing is
            // returned (the row does not belong to it yet).
            $other = $changesAttendance
                ? (float) $attendance->saleWorkers()->sum('amount')
                : (float) $attendance->saleWorkers()->where('id', '!=', $saleWorker->id)->sum('amount');
            $remaining = (float) $attendance->total_wage - $other;

            if ($newAmount > $remaining) {
                return back()->with('error', "Montant insuffisant ! Max: $remaining");
            }

            $previousSaleId = (int) $saleWorker->sale_id;
            $targetSaleId = isset($validated['sale_id']) ? (int) $validated['sale_id'] : null;
            $finalSaleId = $targetSaleId ?? $previousSaleId;

            // Soft-deleted rows still occupy the UNIQUE(sale_id, attendance_id)
            // index. Purge them first, otherwise even an amount-only update
            // that rewrites the same pair crashes with a 500.
            SaleWorker::onlyTrashed()
                ->where('sale_id', $finalSaleId)
                ->where('attendance_id', $finalAttendanceId)
                ->forceDelete();

            if (($targetSaleId !== null && $targetSaleId !== $previousSaleId) || $changesAttendance) {
                $sale = Sale::findOrFail($finalSaleId);
                $sessionId = $attendance->sessionZone?->daily_session_id;

                if ($sessionId === null || (int) $sale->session_id !== (int) $sessionId) {
                    return back()->with('error', 'La vente doit appartenir à la même journée que le pointage.');
                }

                $duplicate = SaleWorker::where('sale_id', $finalSaleId)
                    ->where('attendance_id', $finalAttendanceId)
                    ->where('id', '!=', $saleWorker->id)
                    ->exists();

                if ($duplicate) {
                    return back()->with('error', 'Ce pointage est déjà imputé à cette vente.');
                }
            }

            $saleWorker->unsetRelation('sale');

            try {
                $saleWorker->update([
                    'sale_id' => $finalSaleId,
                    'attendance_id' => $finalAttendanceId,
                    'amount' => $newAmount,
                ]);
            } catch (QueryException $e) {
                // Race condition on the UNIQUE(sale_id, attendance_id) index.
                return back()->with('error', 'Ce pointage est déjà imputé à cette vente.');
            }

            if ($targetSaleId !== null && $targetSaleId !== $previousSaleId) {
                Sale::find($previousSaleId)?->calculateTotals();
            }

            return back()->with('success', 'Salaire mis à jour.');
        });
    }

    public function destroy(SaleWorker $saleWorker)
    {
        $attendance = $saleWorker->attendance;

        $saleWorker->delete();

        return back()->with([
            'success' => 'Supprimée !',
            'updated_attendance' => $attendance?->fresh()->load('saleWorkers.sale.customer'),
        ]);
    }
}
