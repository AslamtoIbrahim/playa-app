import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Difference } from '@/types/difference';
import { formatDateDisplay } from '@/lib/date';

interface DifferenceWithInvoice extends Difference {
    invoice_item?: Difference['invoice_item'] & {
        invoice?: { date: string };
        boat?: { name: string };
        item?: { name: string };
    };
}

export function useDifferenceExport() {
    /** * 1. تحضير البيانات للتصدير
     */
    const prepareData = (items: DifferenceWithInvoice[]) => {
        return items.map((row) => ({
            item: row.invoice_item?.item?.name || '-',
            qty: row.unit_count,
            realPrice: Number(row.real_price).toFixed(2),
            unitPrice: Number(row.invoice_item?.unit_price).toFixed(2),
            totalDiff: row.total_diff,
        }));
    };

    /**
     * 2. تصدير Excel مع دعم الحسابات (SUM) وتنسيق الفاصلة
     */
    const exportToExcel = (
        items: DifferenceWithInvoice[],
        customerName: string,
    ) => {
        const data = prepareData(items);

        const excelData = data.map((d) => ({
            ARTICLE: d.item,
            QUANTITÉ: Number(d.qty),
            'PRIX RÉEL': Number(d.realPrice),
            'PRIX UNITAIRE': Number(d.unitPrice),
            'MONTANT DIFF': Number(d.totalDiff),
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // تحديد النطاق (Range) لتطبيق التنسيق على الأعمدة الرقمية
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            // الأعمدة B (الكمية)، C (الثمن الحقيقي)، D (الثمن الوحدوي)، E (الفرق)
            ['B', 'C', 'D', 'E'].forEach((col) => {
                const cell = worksheet[col + (R + 1)];

                if (cell && cell.t === 'n') {
                    cell.z = '#,##0.00';
                }
            });
        }

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');

        XLSX.writeFile(workbook, `Rapport_Diff_${customerName}.xlsx`);
    };

    /** * 3. تصدير PDF
     */
    const exportToPDF = (
        items: DifferenceWithInvoice[],
        totalBoxes: number,
        totalAmount: number,
    ) => {
        const doc = new jsPDF();

        const data = prepareData(items);

        const first = items[0];

        // Header
        doc.setFontSize(16);

        doc.text(`Rapport de Différence - ${first?.customer?.name}`, 14, 20);

        doc.setFontSize(10);

        doc.text(
            `Date: ${formatDateDisplay(first?.invoice_item?.invoice?.date)}`,
            14,
            28,
        );

        doc.text(`Bateau: ${first?.invoice_item?.boat?.name || '-'}`, 14, 34);

        // Table
        autoTable(doc, {
            startY: 45,
            head: [['ARTICLE', 'QTÉ', 'RÉEL', 'UNITAIRE', 'MONTANT']],
            body: data.map((d) => [
                d.item,
                d.qty,
                d.realPrice,
                d.unitPrice,
                d.totalDiff.toLocaleString(),
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 9 },
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 15;

        doc.setFontSize(10);

        doc.text(`Total Caisses: ${totalBoxes}`, 14, finalY);

        doc.setFontSize(12);

        doc.text(
            `TOTAL DIFF: ${totalAmount.toLocaleString()} DH`,
            196,
            finalY,
            {
                align: 'right',
            },
        );

        doc.save(`Rapport_${first?.customer?.name}.pdf`);
    };

    return { exportToExcel, exportToPDF };
}
