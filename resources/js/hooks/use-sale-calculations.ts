import { Sale } from '@/types/sale';
import { useMemo } from 'react';

export const useSaleCalculations = (sale: Sale) => {
    return useMemo(() => {
        {
            const netToPay = Number(sale.amount || 0);
            const totalBoxes = Number(sale.boxes || 0);
            const totalWeight = Number(sale.weight || 0);
            
            // Total HT f l-bi3 (bla sandaq)
            const totalHT = netToPay - totalBoxes;

            const formatCurrency = (amount: number) => {
                {
                    return amount.toLocaleString('fr-FR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    });
                }
            };

            const result = {
                netToPay,
                totalBoxes,
                totalWeight,
                totalHT,
                formattedNetToPay: formatCurrency(netToPay),
                formattedTotalHT: formatCurrency(totalHT),
                formattedBoxes: totalBoxes.toLocaleString('fr-FR'),
                formattedWeight: totalWeight.toFixed(2)
            };

            return result;
        }
    }, [sale.amount, sale.boxes, sale.weight]);
};