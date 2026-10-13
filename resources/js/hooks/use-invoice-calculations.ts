import { Invoice } from '@/types/invoice';
import { useMemo } from 'react';

export const useInvoiceCalculations = (invoice: Invoice) => {
    return useMemo(() => {
        const netToPay = Number(invoice.amount || 0);
        const tvaAmount = Number(invoice.tva || 0);
        const totalBoxes = Number(invoice.boxes || 0);
        const totalWeight = Number(invoice.weight || 0);
        const invoiceItems = invoice.items ?? [];
        const differences = invoiceItems.flatMap(
            (item) => item.differences ?? [],
        );
        const totalDifference =
            differences.length > 0
                ? differences.reduce(
                      (sum, difference) =>
                          sum + Number(difference.total_diff || 0),
                      0,
                  )
                : undefined;
        // الحساب ديال HT
        const totalHT = netToPay - tvaAmount - totalBoxes;

        // تنسيق الأرقام (Formatting) باش نسهلو الخدمة على الـ Component
        const formatCurrency = (amount: number) =>
            amount.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

        return {
            netToPay,
            tvaAmount,
            totalBoxes,
            totalWeight,
            totalHT,
            // مكن ترجع حتى النسخ المنسقة واجدة
            formattedNetToPay: formatCurrency(netToPay),
            formattedTotalHT: formatCurrency(totalHT),
            formattedTaxAndBoxes: (tvaAmount + totalBoxes).toFixed(2),
            formattedWeight: totalWeight.toFixed(2),
            totalDifference,
            formattedTotalDifference:
                totalDifference === undefined
                    ? undefined
                    : formatCurrency(totalDifference),
        };
    }, [
        invoice.amount,
        invoice.tva,
        invoice.boxes,
        invoice.weight,
        invoice.items,
    ]);
};
