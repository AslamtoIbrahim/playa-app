import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceItem } from '@/types/invoice-item';
import { Invoice } from '@/types/invoice';
import { Stats } from '@/types/stats';

export function useInvoiceExport() {
    /** * 1. تحضير البيانات بسميات تقنية ثابتة
     */
    const prepareData = (items: InvoiceItem[]) => {
        return items.map((row) => ({
            boatName: row.boat?.name || '-',
            itemName: row.item?.name || '-',
            qty: row.unit_count,
            price: row.unit_price,
            unit: row.unit,
            weight: row.weight,
            amount: row.amount,
        }));
    };

    /**
     * 2. تصدير Excel مع الحفاظ على دقة الحسابات وتنسيق الأرقام
     */
    const exportToExcel = (invoice: Invoice, items: InvoiceItem[]) => {
        const data = prepareData(items);

        const excelData = data.map((d) => ({
            BATEAU: d.boatName,
            ESPÈCES: d.itemName,
            'QTE / NC': Number(d.qty),
            'PRIX UNITAIRE': Number(d.price),
            UNITÉ: d.unit,
            'POIDS (KG)': Number(d.weight),
            'VALEUR DH': Number(d.amount),
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);

        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            /**
             * الأعمدة الرقمية:
             * C: QTE / NC
             * D: PRIX UNITAIRE
             * F: POIDS (KG)
             * G: VALEUR DH
             */
            ['C', 'D', 'F', 'G'].forEach((col) => {
                const cell = worksheet[col + (R + 1)];

                if (cell && cell.t === 'n') {
                    cell.z = '#,##0.00';
                }
            });
        }

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Items');

        XLSX.writeFile(workbook, `Facture_${invoice.invoice_number}.xlsx`);
    };

    /** * 3. تصدير CSV
     */
    const exportToCSV = (invoice: Invoice, items: InvoiceItem[]) => {
        const data = prepareData(items);
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, `Facture_${invoice.invoice_number}.csv`, {
            bookType: 'csv',
        });
    };

    /** * 4. تصدير PDF مع حل مشكل الـ Types
     */
    const exportToPDF = (
        invoice: Invoice,
        items: InvoiceItem[],
        stats: Stats,
    ) => {
        const doc = new jsPDF();
        const data = prepareData(items);

        // Header
        doc.setFontSize(18);
        doc.text(invoice.invoice_number, 14, 22);
        doc.setFontSize(10);
        doc.text('PLAYA', 170, 22);
        doc.text(invoice.date, 170, 28);

        // Table - هنا استعملنا d.boatName و d.itemName لي كاينين ف prepareData
        autoTable(doc, {
            startY: 40,
            head: [
                [
                    'BATEAU',
                    'ESPÈCES',
                    'QTE / NC',
                    'PRIX UNIT',
                    'UNITÉ',
                    'POIDS',
                    'VALEUR DH',
                ],
            ],
            body: data.map((d) => [
                d.boatName,
                d.itemName,
                d.qty,
                d.price,
                d.unit,
                d.weight,
                d.amount.toLocaleString(),
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 8 },
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(9);
        doc.text(`Total Caisses: ${stats.totalBoxes}`, 14, finalY);
        doc.text(`Total Poids: ${stats.formattedWeight} KG`, 14, finalY + 6);
        const cleanNetPrice = stats.formattedNetToPay
            .replace(/\s/g, ' ')
            .replace(/\//g, '')
            .trim();
        console.log('cleanNetPrice', cleanNetPrice);
        doc.setFontSize(11);
        doc.text(`NET À PAYER:   ${cleanNetPrice} DH`, 155, finalY + 12, {
            align: 'right',
        });

        doc.save(`Facture_${invoice.invoice_number}.pdf`);
    };

    return { exportToExcel, exportToCSV, exportToPDF };
}
