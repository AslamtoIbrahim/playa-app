import { Invoice } from '@/types/invoice';
import { useMemo } from 'react';

export const useInvoiceCalculations = (invoice: Invoice) => {
    return useMemo(() => {
        const netToPay = Number(invoice.amount || 0);
        const tvaAmount = Number(invoice.tva || 0);
        const totalBoxes = Number(invoice.boxes || 0);
        const totalWeight = Number(invoice.weight || 0);
        const invoiceItems = invoice.items ?? [];
        const categoryTotals = new Map<
            number,
            { name: string; unit: string; total: number; sold: number }
        >();

        invoiceItems.forEach((item) => {
            const current = categoryTotals.get(item.category_id) ?? {
                name: item.category?.name ?? `Catégorie ${item.category_id}`,
                unit: item.unit,
                total: 0,
                sold: 0,
            };

            current.total += Number(item.unit_count || 0);
            current.sold += (item.sale_items ?? [])
                .filter((saleItem) => !saleItem.deleted_at)
                .reduce(
                    (sum, saleItem) =>
                        sum + Math.abs(Number(saleItem.unit_count || 0)),
                    0,
                );
            categoryTotals.set(item.category_id, current);
        });
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
        const formatNumber = (amount: number) =>
            amount.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

        const categoryBreakdown = [...categoryTotals.entries()].map(
            ([id, category]) => ({
                id,
                ...category,
                remaining: category.total - category.sold,
            }),
        );

        return {
            netToPay,
            tvaAmount,
            totalBoxes,
            totalWeight,
            totalHT,
            categoryBreakdown,
            // مكن ترجع حتى النسخ المنسقة واجدة
            formattedNetToPay: formatNumber(netToPay),
            formattedTotalHT: formatNumber(totalHT),
            formattedTaxAndBoxes: formatNumber(tvaAmount + totalBoxes),
            formattedWeight: formatNumber(totalWeight),
            totalDifference,
            formattedTotalDifference:
                totalDifference === undefined
                    ? undefined
                    : formatNumber(totalDifference),
        };
    }, [
        invoice.amount,
        invoice.tva,
        invoice.boxes,
        invoice.weight,
        invoice.items,
    ]);
};
