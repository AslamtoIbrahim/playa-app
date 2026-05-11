import { Attendance } from '@/types/attendance';
import { AttendanceItem } from '@/types/attendance-item';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function useAttendanceExport() {
    /**
     * 1. Prepare data with technical keys
     */
    const prepareData = (items: AttendanceItem[]) => {
        {
            return items.map((row) => {
                {
                    return {
                        workerName: row.worker?.name || '-',
                        wage: Number(row.wage),
                        status: 'Présent',
                    };
                }
            });
        }
    };

    /**
     * 2. Export Excel with numeric formatting
     */
    const exportToExcel = (attendance: Attendance) => {
        {
            const items = attendance.items || [];

            const data = prepareData(items);

            const excelData = data.map((d) => {
                {
                    return {
                        OUVRIER: d.workerName,
                        'SALAIRE (DH)': d.wage,
                        STATUT: d.status,
                    };
                }
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);

            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

            // Formatting currency column (C: SALAIRE)
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                {
                    const cell = worksheet['C' + (R + 1)];

                    if (cell && cell.t === 'n') {
                        {
                            cell.z = '#,##0.00';
                        }
                    }
                }
            }

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Pointage');

            XLSX.writeFile(
                workbook,
                `Pointage_${attendance.id}_${attendance.date}.xlsx`,
            );
        }
    };

    /**
     * 3. Export CSV
     */
    const exportToCSV = (attendance: Attendance) => {
        {
            const items = attendance.items || [];

            const data = prepareData(items);

            const worksheet = XLSX.utils.json_to_sheet(data);

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

            XLSX.writeFile(workbook, `Pointage_${attendance.id}.csv`, {
                bookType: 'csv',
            });
        }
    };

    /**
     * 4. Export PDF
     */
    const exportToPDF = (attendance: Attendance) => {
        {
            const doc = new jsPDF();

            const items = attendance.items || [];

            const data = prepareData(items);

            // Header Style
            doc.setFontSize(18);

            doc.text(`POINTAGE #${attendance.id}`, 14, 22);

            doc.setFontSize(10);

            doc.text('GESTION CHANTIER', 160, 22);

            doc.text(
                `Date: ${format(new Date(attendance.date), 'dd-MM-yyyy')}`,
                160,
                28,
            );

            doc.text(
                `Session: ${attendance.sessionZone?.status || '-'}`,
                160,
                34,
            );

            // Table
            autoTable(doc, {
                startY: 45,
                head: [['OUVRIER', 'STATUT', 'SALAIRE (DH)']],
                body: data.map((d) => {
                    {
                        return [
                            d.workerName,
                            d.status,
                            d.wage.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                            }),
                        ];
                    }
                }),
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42] }, // Slate 900
                styles: { fontSize: 9 },
                columnStyles: {
                    3: { halign: 'right' }, // Align wage to right
                },
            });

            // Summary Footer
            const finalY = (doc as any).lastAutoTable.finalY + 15;

            doc.setFontSize(12);

            const total = Number(attendance.total_wage).toLocaleString(
                'fr-FR',
                {
                    minimumFractionDigits: 2,
                },
            );

            doc.text(`TOTAL DES SALAIRES:    ${total} DH`, 196, finalY, {
                align: 'right',
            });

            doc.save(`Pointage_${attendance.id}_${attendance.date}.pdf`);
        }
    };

    return { exportToExcel, exportToCSV, exportToPDF };
}
