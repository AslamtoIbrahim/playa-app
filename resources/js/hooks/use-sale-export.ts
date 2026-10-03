import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaleItem } from '@/types/sale-item';
import { Sale } from '@/types/sale';
import { SaleStats } from '@/types/sale-stats';

/**
 * Export d'une vente : la vente est alimentée par les lignes de facture
 * d'achat, chaque ligne affiche donc l'article, le bateau et la facture
 * d'origine, la quantité vendue, le prix réel et l'écart en résultant.
 */
export function useSaleExport() {
    /**
     * 1. Normalisation des lignes en clés techniques.
     */
    const prepareData = (items: SaleItem[]) => {
        {
            return items.map((row) => {
                {
                    const invoiceItem = row.invoice_item;

                    return {
                        itemName: invoiceItem?.item?.name || '-',
                        boatName: invoiceItem?.boat?.name || '-',
                        invoiceNumber: invoiceItem?.invoice?.invoice_number
                            ? `#${invoiceItem.invoice.invoice_number}`
                            : '-',
                        qty: Number(row.unit_count),
                        realPrice: Number(row.real_price),
                        unitPrice: Number(invoiceItem?.unit_price ?? 0),
                        unit: invoiceItem?.unit || '',
                        diff: Number(row.total_diff),
                        value: Number(row.unit_count) * Number(row.real_price),
                    };
                }
            });
        }
    };

    /**
     * 2. Export Excel (colonnes numériques formatées).
     */
    const exportToExcel = (sale: Sale, items: SaleItem[]) => {
        {
            const data = prepareData(items);

            const excelData = data.map((d) => {
                {
                    return {
                        ESPÈCES: d.itemName,
                        BATEAU: d.boatName,
                        FACTURE: d.invoiceNumber,
                        'QTE / NC': d.qty,
                        'PRIX RÉEL': d.realPrice,
                        'P.U FACTURE': d.unitPrice,
                        'DIFF TOTAL': d.diff,
                        'VALEUR DH': d.value,
                    };
                }
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);

            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                {
                    /**
                     * Colonnes: D: QTE, E: PRIX RÉEL, F: P.U, G: DIFF, H: VALEUR
                     */
                    ['D', 'E', 'F', 'G', 'H'].forEach((col) => {
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
     * 3. Export CSV.
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
     * 4. Export PDF de la vente.
     */
    const exportToPDF = (sale: Sale, items: SaleItem[], stats: SaleStats) => {
        {
            const doc = new jsPDF();

            const data = prepareData(items);

            doc.setFontSize(18);

            doc.text(`VENTE #${sale.id}`, 14, 22);

            doc.setFontSize(10);

            doc.text('PLAYA', 190, 22, { align: 'right' });

            doc.text(sale.date, 190, 28, { align: 'right' });

            autoTable(doc, {
                startY: 40,
                head: [
                    [
                        'ESPÈCES',
                        'BATEAU',
                        'FACTURE',
                        'QTE',
                        'PRIX RÉEL',
                        'P.U FACTURE',
                        'DIFF',
                        'VALEUR DH',
                    ],
                ],
                body: data.map((d) => {
                    {
                        return [
                            d.itemName,
                            d.boatName,
                            d.invoiceNumber,
                            d.qty,
                            d.realPrice,
                            d.unitPrice,
                            d.diff
                                .toLocaleString('fr-FR', {
                                    minimumFractionDigits: 2,
                                })
                                .replace(/\s/g, ' ')
                                .replace(/\//g, '')
                                .trim(),
                            d.value.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                            }),
                        ];
                    }
                }),
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42] },
                styles: { fontSize: 8 },
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;

            doc.setFontSize(9);

            doc.text(`Total Caisses: ${stats.totalBoxes}`, 14, finalY);

            doc.text(
                `Total Poids: ${stats.formattedWeight} KG`,
                14,
                finalY + 6,
            );

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