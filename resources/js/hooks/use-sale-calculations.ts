import { formatDifferenceAmount } from '@/lib/differences';
import {
    computeSaleBoxesFee,
    computeSaleChargesTotal,
    computeSaleNetToPay,
    computeSaleTax,
    computeSaleTotalDiff,
    computeSaleWorkersTotal,
} from '@/lib/sales';
import { Sale } from '@/types/sale';
import { useMemo } from 'react';

/**
 * Synthèse financière d'une vente.
 *
 * `sale.amount` (enregistré par `Sale::calculateTotals()`) vaut les lignes au
 * prix réel PLUS les bons imputés (SaleCharges) PLUS les parts ouvriers
 * affectées (SaleWorkers). Les lignes au prix réel contenant déjà l'écart, la
 * valeur totale affichée est ce montant diminué de l'écart (qui a sa propre
 * carte). Le net à payer reprend la valeur, l'écart, la taxe de 3 % et les
 * frais de caisse, chacun une seule fois. La part des bons et la part ouvrière sont exposées à part
 * (mêmes sources `sale.charges` / `sale.workers` que les tableaux) sans
 * double comptage : la part ouvrière est toujours la somme des
 * `SaleWorkers.amount` de la vente, jamais `Attendance.total_wage`.
 */
export const useSaleCalculations = (sale: Sale) => {
    return useMemo(() => {
        {
            // Montant enregistré par `Sale::calculateTotals()` : lignes au prix
            // réel (donc écart inclus) + bons + parts ouvrières.
            const saleAmount = Number(sale.amount || 0);
            const totalBoxes = Number(sale.boxes || 0);
            const totalWeight = Number(sale.weight || 0);

            // Part des bons imputés dans la valeur (même source que le tableau).
            const totalCharges = computeSaleChargesTotal(sale.charges);

            // Part ouvrière imputée (même source que le tableau) : somme des
            // SaleWorkers.amount rattachés à la vente.
            const totalWorkers = computeSaleWorkersTotal(sale.workers);

            // Somme des écarts des lignes, comme la colonne « Diff Total ».
            const totalDiff = computeSaleTotalDiff(sale.items);

            // Valeur hors écart : `qté × prix réel` contient déjà l'écart, qui a
            // sa propre carte. On le retire pour ne pas le compter deux fois.
            const totalValeur = saleAmount - totalDiff;

            // Taxe de 3 % sur le montant de la vente (écart inclus), comme
            // `CalculatesSessionTotals` côté serveur.
            const taxAmount = computeSaleTax(saleAmount);

            // Frais de caisse : 1 DH par caisse.
            const boxesFee = computeSaleBoxesFee(totalBoxes);

            // Le net à payer inclut le diff, la taxe et les frais de caisse.
            const netToPay = computeSaleNetToPay(
                totalValeur,
                totalDiff,
                taxAmount,
                boxesFee,
            );

            // Complément détaillé sous le net à payer : la taxe et les frais de
            // caisse, l'écart ayant sa propre carte.
            const taxAndBoxes = taxAmount + boxesFee;

            const formatCurrency = (amount: number) => {
                {
                    return amount.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    });
                }
            };

            const formatSigned = (amount: number) => {
                {
                    return (
                        (amount > 0 ? '+' : '') + formatDifferenceAmount(amount)
                    );
                }
            };

            const result = {
                totalValeur,
                totalBoxes,
                totalWeight,
                totalDiff,
                totalCharges,
                totalWorkers,
                taxAmount,
                boxesFee,
                netToPay,
                formattedNetToPay: formatCurrency(netToPay),
                formattedTotalValeur: formatCurrency(totalValeur),
                formattedTotalCharges: formatCurrency(totalCharges),
                formattedTotalWorkers: formatCurrency(totalWorkers),
                formattedTotalDiff: formatSigned(totalDiff),
                formattedTaxAmount: formatCurrency(taxAmount),
                formattedTaxAndBoxes: formatSigned(taxAndBoxes),
                formattedBoxes: totalBoxes.toLocaleString('fr-FR'),
                formattedWeight: totalWeight.toFixed(2),
            };

            return result;
        }
    }, [
        sale.amount,
        sale.boxes,
        sale.weight,
        sale.items,
        sale.charges,
        sale.workers,
    ]);
};
