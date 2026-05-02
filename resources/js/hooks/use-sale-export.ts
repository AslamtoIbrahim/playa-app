import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaleItem } from '@/types/sale-item';
import { Sale } from '@/types/sale';
import { SaleStats } from '@/types/sale-stats';

export function useSaleExport() {
    /**
     * 1. Prepare data with technical keys
     */
    const prepareData = (items: SaleItem[]) => {
        {
            return items.map((row) => {
                {
                    const totalAmount =
                        Number(row.unit_count) * Number(row.unit_price);

                    return {
                        boatName: row.boat?.name || '-',
                        itemName: row.item?.name || '-',
                        qty: row.unit_count,
                        price: row.unit_price,
                        unit: row.unit,
                        weight: row.weight,
                        amount: totalAmount,
                        box: row.box,
                    };
                }
            });
        }
    };

    /**
     * 2. Export Excel with numeric formatting
     */
    const exportToExcel = (sale: Sale, items: SaleItem[]) => {
        {
            const data = prepareData(items);

            const excelData = data.map((d) => {
                {
                    return {
                        BATEAU: d.boatName,
                        ESPÈCES: d.itemName,
                        'QTE / NC': Number(d.qty),
                        'PRIX UNITAIRE': Number(d.price),
                        UNITÉ: d.unit,
                        'POIDS (KG)': Number(d.weight),
                        CAISSES: Number(d.box),
                        'VALEUR DH': Number(d.amount),
                    };
                }
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);

            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                {
                    /**
                     * Columns: C: QTE, D: PRICE, F: WEIGHT, G: BOX, H: AMOUNT
                     */
                    ['C', 'D', 'F', 'G', 'H'].forEach((col) => {
                        {
                            const cell = worksheet[col + (R + 1)];

                            if (cell && cell.t === 'n') {
                                {
                                    cell.z = '#,##0.00';
                                }
                            }
                        }
                    });
                }
            }

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sale Items');

            XLSX.writeFile(workbook, `Vente_${sale.id}_${sale.date}.xlsx`);
        }
    };

    /**
     * 3. Export CSV
     */
    const exportToCSV = (sale: Sale, items: SaleItem[]) => {
        {
            const data = prepareData(items);

            const worksheet = XLSX.utils.json_to_sheet(data);

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

            XLSX.writeFile(workbook, `Vente_${sale.id}.csv`, {
                bookType: 'csv',
            });
        }
    };

    /**
     * 4. Export PDF SALE
     */
    const exportToPDF = (sale: Sale, items: SaleItem[], stats: SaleStats) => {
        {
            const doc = new jsPDF();

            const data = prepareData(items);

            // Header - Style dyal l-Inspiration
            doc.setFontSize(18);

            doc.text(`VENTE #${sale.id}`, 14, 22);

            doc.setFontSize(10);

            doc.text('PLAYA', 170, 22);

            doc.text(sale.date, 170, 28);

            // Table
            autoTable(doc, {
                startY: 40,
                head: [
                    [
                        'BATEAU',
                        'ESPÈCES',
                        'QTE',
                        'P.U',
                        'UNITÉ',
                        'POIDS',
                        'BOX',
                        'TOTAL DH',
                    ],
                ],
                body: data.map((d) => {
                    {
                        return [
                            d.boatName,
                            d.itemName,
                            d.qty,
                            d.price,
                            d.unit,
                            d.weight,
                            d.box,
                            d.amount
                                .toLocaleString('fr-FR', {
                                    minimumFractionDigits: 2,
                                })
                                .replace(/\s/g, ' ')
                                .replace(/\//g, '')
                                .trim(),
                        ];
                    }
                }),
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42] }, // Darker Slate kif l-inspiration
                styles: { fontSize: 8 },
            });

            // Footer - Logic d l-Inspiration bach i-tla3 zwin
            const finalY = (doc as any).lastAutoTable.finalY + 10;

            doc.setFontSize(9);

            doc.text(`Total Caisses: ${stats.totalBoxes}`, 14, finalY);

            doc.text(
                `Total Poids: ${stats.formattedWeight} KG`,
                14,
                finalY + 6,
            );

            // Cleaning l-prix kima derti f l-inspiration
            const cleanNetPrice = stats.formattedNetToPay
                .replace(/\s/g, ' ')
                .replace(/\//g, '')
                .trim();

            doc.setFontSize(11);

            doc.text(`NET À PAYER:    ${cleanNetPrice} DH`, 155, finalY + 12, {
                align: 'right',
            });

            doc.save(`Vente_${sale.id}.pdf`);
        }
    };

    return { exportToExcel, exportToCSV, exportToPDF };
}
