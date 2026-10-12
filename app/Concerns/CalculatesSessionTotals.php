<?php

namespace App\Concerns;

use App\Models\Attendance;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleCharge;
use App\Models\SaleItem;
use App\Models\SaleWorker;

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

        // Les ventes directes restent rattachées à la journée via sales.session_id.
        // Leurs lignes et imputations permettent toutefois un calcul précis par zone.
        $directSaleItems = (float) SaleItem::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'purchase');
        })->selectRaw('COALESCE(SUM(unit_count * real_price), 0) as aggregate')->value('aggregate');

        $directSaleCharges = (float) SaleCharge::whereHas('receipt', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds);
        })->sum('amount');

        $directSaleWorkers = (float) SaleWorker::whereHas('attendance', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds);
        })->sum('amount');

        $directSales = $directSaleItems + $directSaleCharges + $directSaleWorkers;

        // Les lignes directes sont saisies au prix réel : `unit_count *
        // real_price` contient donc déjà l'écart (`total_diff`). On l'isole pour
        // que la taxe porte sur la valeur seule, l'écart étant compté à part
        // dans le total de vente.
        $directSalesDiff = (float) SaleItem::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'purchase');
        })->sum('total_diff');

        $directSalesValue = $directSales - $directSalesDiff;

        // Les ventes directes sont enregistrées HT. Le total de session doit
        // afficher leur net à payer, comme la table des ventes et la fiche de
        // vente : valeur + écart + taxe de 3 % sur la valeur seule + 1 DH par
        // caisse. Les factures de vente incluent déjà ces frais.
        $directSalesTax = $directSalesValue * 0.03;
        $directSalesBoxesFee = (float) Sale::whereHas('session.sessionZones', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zones.id', $sessionZoneIds);
        })->sum('boxes');

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
        $sale = $directSales + $directSalesTax + $directSalesBoxesFee + $saleInvoices + $saleDifferences + $saleReceipts;
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
