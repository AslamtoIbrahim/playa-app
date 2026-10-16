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
 * carte), des bons et de la part ouvrière : d'une part ces deux parts ont leur
 * propre carte (« Total Bons », « Total Ouvriers ») et d'autre part le net à
 * payer, qui est une carte à part, les reprend déjà. Le net à payer reprend la
 * valeur, l'écart, la taxe de 3 % et les frais de caisse, chacun une seule fois,
 * plus les bons et la part ouvrière. La part des bons et la part ouvrière sont exposées à part
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

            // Valeur hors écart, hors bons et hors part ouvrière : `qté × prix
            // réel` contient déjà l'écart, qui a sa propre carte. Les bons et la
            // part ouvrière ont aussi leurs propres cartes et sont déjà repris
            // dans le net à payer : on les retire de la valeur pour ne pas les
            // compter deux fois.
            const totalValeur = saleAmount - totalDiff - totalCharges - totalWorkers;

            // Taxe de 3 % sur la valeur seule (hors écart).
            const taxAmount = (sale.items ?? []).reduce(
                (sum, item) => sum + (Number(item.tax) || 0),
                0,
            );

            // Frais de caisse : 1 DH par caisse.
            const boxesFee = computeSaleBoxesFee(totalBoxes);

            // Le net à payer inclut les bons, la part ouvrière, le diff, la taxe
            // et les frais de caisse : c'est le total de toutes les cartes, la
            // valeur étant isolée de leurs parts.
            const netToPay = computeSaleNetToPay(
                totalValeur,
                totalDiff,
                taxAmount,
                boxesFee,
                totalCharges + totalWorkers,
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
