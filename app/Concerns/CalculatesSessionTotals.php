<?php

namespace App\Concerns;

use App\Models\Attendance;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\Receipt;

/**
 * Totaux financiers d'un ensemble de zones de journée (session_zones).
 *
 * Les factures, bons de réception et pointages sont rattachés au SessionZone
 * (et non plus directement à la journée) : la formule est donc exprimée par
 * session zone, et partagée par la liste des journées, la fiche d'une journée
 * et la fiche d'une zone.
 */
trait CalculatesSessionTotals
{
    /**
     * Totaux financiers d'un ou plusieurs session_zones.
     *
     * Les colonnes session_zones.total_buy / total_sell ne sont pas
     * alimentées : les montants sont toujours recalculés depuis les opérations
     * rattachées, ce qui évite tout décalage avec la fiche de la journée.
     *
     * Le total d'achat cumule les factures d'achat, leurs différences et les
     * bons de réception, puis y ajoute la masse salariale des pointages : les
     * ouvriers sont une charge de la journée. Le total de vente suit la même
     * logique côté vente, sans charge.
     *
     * @param  array<int, int>  $sessionZoneIds
     * @return array{purchase: float, sale: float, attendance: float, buy: float, sell: float, margin: float}
     */
    protected function sessionTotals(array $sessionZoneIds): array
    {
        $purchaseInvoices = (float) Invoice::whereIn('session_zone_id', $sessionZoneIds)
            ->where('type', 'purchase')
            ->sum('amount');

        $purchaseDifferences = (float) Difference::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'purchase');
        })->sum('total_diff');

        // Les bons sans lien facture (bons vides ou à saisie directe) sont
        // comptés côté achats, comme dans l'onglet Réceptions.
        $purchaseReceipts = (float) Receipt::whereIn('session_zone_id', $sessionZoneIds)
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->whereDoesntHave('items')
                        ->orWhereHas('items', function ($i) {
                            $i->whereNull('invoice_item_id');
                        });
                })->orWhereHas('items.invoiceItem.invoice', function ($q2) {
                    $q2->where('type', 'purchase');
                });
            })->sum('total_amount');

        $saleInvoices = (float) Invoice::whereIn('session_zone_id', $sessionZoneIds)
            ->where('type', 'sale')
            ->sum('amount');

        $saleDifferences = (float) Difference::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'sale');
        })->sum('total_diff');

        $saleReceipts = (float) Receipt::whereIn('session_zone_id', $sessionZoneIds)
            ->whereHas('items.invoiceItem.invoice', function ($q) {
                $q->where('type', 'sale');
            })->sum('total_amount');

        // Masse salariale des feuilles de pointage (les pointages supprimés,
        // donc soft-deleted, sont automatiquement exclus).
        $attendanceWages = (float) Attendance::whereIn('session_zone_id', $sessionZoneIds)->sum('total_wage');

        $purchase = $purchaseInvoices + $purchaseDifferences + $purchaseReceipts;
        $sale = $saleInvoices + $saleDifferences + $saleReceipts;
        $buy = $purchase + $attendanceWages;

        return [
            'purchase' => $purchase,
            'sale' => $sale,
            'attendance' => $attendanceWages,
            'buy' => $buy,
            'sell' => $sale,
            'margin' => $sale - $buy,
        ];
    }
}
