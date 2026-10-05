import { formatDifferenceAmount } from '@/lib/differences';
import {
    computeSaleBoxesFee,
    computeSaleNetToPay,
    computeSaleTax,
    computeSaleTotalDiff,
} from '@/lib/sales';
import { Sale } from '@/types/sale';
import { useMemo } from 'react';

/**
 * Synthèse financière d'une vente.
 *
 * La valeur totale est celle enregistrée par `Sale::calculateTotals()`, c'est-à-dire
 * la somme des lignes au prix réel. Le net à payer affiché la majore de l'écart des
 * lignes, de la taxe de 3 % et des frais de caisse, comme sur la fiche facture.
 */
export const useSaleCalculations = (sale: Sale) => {
    return useMemo(() => {
        {
            const totalValeur = Number(sale.amount || 0);
            const totalBoxes = Number(sale.boxes || 0);
            const totalWeight = Number(sale.weight || 0);

            // Somme des écarts des lignes, comme la colonne « Diff Total ».
            const totalDiff = computeSaleTotalDiff(sale.items);

            // Taxe de 3 % sur la valeur, alignée sur la TVA des factures.
            const taxAmount = computeSaleTax(totalValeur);

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
                taxAmount,
                boxesFee,
                netToPay,
                formattedNetToPay: formatCurrency(netToPay),
                formattedTotalValeur: formatCurrency(totalValeur),
                formattedTotalDiff: formatSigned(totalDiff),
                formattedTaxAmount: formatCurrency(taxAmount),
                formattedTaxAndBoxes: formatSigned(taxAndBoxes),
                formattedBoxes: totalBoxes.toLocaleString('fr-FR'),
                formattedWeight: totalWeight.toFixed(2),
            };

            return result;
        }
    }, [sale.amount, sale.boxes, sale.weight, sale.items]);
};
