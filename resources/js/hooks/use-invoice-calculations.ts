import { Invoice } from '@/types/invoice';
import { useMemo } from 'react';

export const useInvoiceCalculations = (invoice: Invoice) => {
    return useMemo(() => {
        const netToPay = Number(invoice.amount || 0);
        const tvaAmount = Number(invoice.tva || 0);
        const totalBoxes = Number(invoice.boxes || 0);
        const totalWeight = Number(invoice.weight || 0);
        
        // الحساب ديال HT
        const totalHT = netToPay - tvaAmount - totalBoxes;

        // تنسيق الأرقام (Formatting) باش نسهلو الخدمة على الـ Component
        const formatCurrency = (amount: number) => 
            amount.toLocaleString('fr-FR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
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
            formattedWeight: totalWeight.toFixed(2)
        };
    }, [invoice.amount, invoice.tva, invoice.boxes, invoice.weight]);
};