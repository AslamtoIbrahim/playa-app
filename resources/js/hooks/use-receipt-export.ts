import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Receipt } from '@/types/receipt';
import { ReceiptItem } from '@/types/receipt-item';
import { formatDateDisplay } from '@/lib/date';

/**
 * نستخدم Omit لحذف التعارض وتوسيع الواجهة بشكل صحيح
 */
interface ExportReceipt extends Omit<Receipt, 'customer' | 'boat'> {
    items?: ReceiptItem[];
    customer?: { name: string };
    boat?: { name: string };
}

export function useReceiptExport() {
    /**
     * 1. تحضير البيانات لجعلها مسطحة (Flat)
     */
    const prepareData = (items: ReceiptItem[]) => {
        return items.map((row) => ({
            item: row.item?.name || '',
            boxes: row.box || 0,
            qty: row.unit_count || 0,
            price: Number(row.real_price).toFixed(2),
            total: (row.unit_count * row.real_price).toFixed(2),
        }));
    };

    /**
     * 2. تصدير Excel مع الحفاظ على الأرقام قابلة للحساب
     */
    const exportToExcel = (receipt: ExportReceipt) => {
        if (!receipt.items) {
            return;
        }

        const data = prepareData(receipt.items);

        const excelData = data.map((d) => ({
            ARTICLE: d.item,
            CAISSES: Number(d.boxes),
            QUANTITÉ: Number(d.qty),
            'PRIX UNITAIRE': Number(d.price),
            'TOTAL DH': Number(d.total),
        }));

        // إنشاء الـ worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // تحديد تنسيق الأرقام (الفاصلة وجوج أرقام وراها) لجميع الخلايا الرقمية
        // هاد التنسيق كيخلي Excel يعرض الفاصلة حسب إعدادات الويندوز بلا ما يخسر الـ SUM
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            // الأعمدة C (الكمية)، D (الثمن)، E (المجموع)
            ['C', 'D', 'E'].forEach((col) => {
                const cell = worksheet[col + (R + 1)];

                if (cell && cell.t === 'n') {
                    cell.z = '#,##0.00'; // تنسيق رقمي احترافي يدعم الفاصلة
                }
            });
        }

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bon_Reception');

        XLSX.writeFile(
            workbook,
            `Bon_${receipt.id}_${receipt.customer?.name || 'Client'}.xlsx`,
        );
    };

    /**
     * 3. تصدير PDF
     */
    const exportToPDF = (receipt: ExportReceipt) => {
        if (!receipt.items) {
            return;
        }

        const doc = new jsPDF();

        const data = prepareData(receipt.items);

        // Header Section
        doc.setFontSize(18);

        doc.text(`Bon de Réception #${receipt.id}`, 14, 20);

        doc.setFontSize(10);

        doc.setTextColor(100);

        doc.text(`Date: ${formatDateDisplay(receipt.date)}`, 14, 30);

        doc.text(`Client: ${receipt.customer?.name || '-'}`, 14, 37);

        if (receipt.boat?.name) {
            doc.text(`Bateau: ${receipt.boat.name}`, 14, 44);
        }

        // Table Section
        autoTable(doc, {
            startY: 52,
            head: [['ARTICLE', 'CAISSES', 'QUANTITÉ', 'P.U', 'TOTAL DH']],
            body: data.map((d) => [
                d.item,
                d.boxes,
                d.qty,
                d.price,
                Number(d.total).toLocaleString(),
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], halign: 'center' },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
            },
            styles: { fontSize: 9 },
        });

        // Footer Section
        const finalY = (doc as any).lastAutoTable.finalY + 15;

        doc.setFontSize(10);

        doc.setTextColor(0);

        doc.text(`Total Caisses: ${receipt.total_boxes || 0}`, 14, finalY);

        doc.setFontSize(14);

        const totalText = `TOTAL: ${Number(receipt.total_amount).toLocaleString()} DH`;

        doc.text(totalText, 196, finalY, {
            align: 'right',
        });

        doc.save(`Bon_${receipt.id}_${receipt.customer?.name || 'Client'}.pdf`);
    };

    return { exportToExcel, exportToPDF };
}
