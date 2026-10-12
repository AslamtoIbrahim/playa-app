<?php

namespace App\Concerns;

use App\Models\Attendance;
use App\Models\Difference;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleItem;

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
     * ouvriers sont une charge de la journée. Le total de vente est la somme du
     * « Montant » des ventes directes (leur net à payer), exactement la colonne
     * Montant de la table des ventes.
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

        // Les ventes directes restent rattachées à la journée via sales.session_id.
        $directSaleItems = (float) SaleItem::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'purchase');
        })->selectRaw('COALESCE(SUM(unit_count * real_price), 0) as aggregate')->value('aggregate');

        // Écart des lignes directes : `unit_count * real_price` contient déjà cet
        // écart, on l'isole pour que la taxe porte sur la valeur seule.
        $directSalesDiff = (float) SaleItem::whereHas('invoiceItem.invoice', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zone_id', $sessionZoneIds)->where('type', 'purchase');
        })->sum('total_diff');

        // Taxe de 3 % sur la valeur seule (lignes hors écart).
        $directSalesTax = ($directSaleItems - $directSalesDiff) * 0.03;

        // Frais de caisse : 1 DH par caisse.
        $directSalesBoxesFee = (float) Sale::whereHas('session.sessionZones', function ($q) use ($sessionZoneIds) {
            $q->whereIn('session_zones.id', $sessionZoneIds);
        })->sum('boxes');

        // Masse salariale des feuilles de pointage (les pointages supprimés,
        // donc soft-deleted, sont automatiquement exclus).
        $attendanceWages = (float) Attendance::whereIn('session_zone_id', $sessionZoneIds)->sum('total_wage');

        $purchase = $purchaseInvoices + $purchaseDifferences + $purchaseReceipts;
        // Total de vente = somme du « Montant » des ventes directes, c'est-à-dire
        // leur net à payer : la carte « Total Ventes » doit afficher exactement la
        // même valeur que la colonne Montant de la table des ventes.
        //
        // Net à payer d'une vente = valeur isolée + écart + bons + part ouvrière
        // + taxe (3 % sur la valeur seule) + frais de caisse ; la valeur étant
        // `lignes − écart − bons − parts`, l'écart, les bons et les parts
        // s'annulent : il reste `lignes + taxe + frais de caisse`. Les lignes
        // contiennent donc déjà l'écart (saisi au prix réel), tandis que les bons
        // et la part ouvrière sont déjà dans leurs propres totaux de session.
        $sale = $directSaleItems + $directSalesTax + $directSalesBoxesFee;
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
