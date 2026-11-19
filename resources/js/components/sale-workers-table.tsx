import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { SaleWorker } from '@/types/sale-worker';
import { SalesShowSelectionStatics } from '@/components/sales-show-selection-statics';
import { useSalesShowTableCellSelection } from '@/hooks/use-sales-show-table-cell-selection';

type SelectionField = 'attendance_id' | 'total_wage' | 'amount';

const numericFields = new Set<SelectionField>(['total_wage', 'amount']);

const getSelectionCellValue = (
    worker: SaleWorker,
    field: SelectionField,
): string => {
    switch (field) {
        case 'attendance_id':
            return String(worker.attendance_id);
        case 'total_wage':
            return String(Number(worker.attendance?.total_wage ?? 0));
        case 'amount':
            return String(Number(worker.amount));
    }
};

interface SaleWorkersTableProps {
    workers: SaleWorker[];
    className?: string;
}

/**
 * Parts de masse salariale imputées à la vente (SaleWorkers).
 *
 * Compact table: attendance number, attendance total_wage and assigned amount.
 * Half-width ready so it sits side by side with the receipt charges table.
 */
export function SaleWorkersTable({
    workers,
    className,
}: SaleWorkersTableProps) {
    const { statistics, getSelectionCellProps } =
        useSalesShowTableCellSelection(
            workers,
            'workers',
            getSelectionCellValue,
            numericFields,
        );

    if (workers.length === 0) {
        return null;
    }

    return (
        <Card
            className={cn(
                'w-full gap-0 overflow-hidden border-slate-200/80 bg-white py-0 shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader className="border-b border-slate-100 bg-linear-to-r from-orange-50/70 to-white px-4 py-3 dark:border-neutral-800 dark:from-orange-950/20 dark:to-neutral-900">
                <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
                    <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        Pointages imputés
                    </span>
                    <SalesShowSelectionStatics statistics={statistics} />
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <TableRow className="h-10 hover:bg-transparent">
                            <TableHead className="w-20 px-4 text-[10px] font-black uppercase">
                                Pointage N°
                            </TableHead>

                            <TableHead className="w-36 px-4 text-right text-[10px] font-black uppercase">
                                Masse salariale
                            </TableHead>

                            <TableHead className="w-36 px-4 text-right text-[10px] font-black uppercase">
                                Montant imputé
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {workers.map((worker) => {
                            return (
                                <TableRow
                                    key={worker.id}
                                    className="h-11 transition-colors hover:bg-orange-50/40 dark:hover:bg-orange-950/10"
                                >
                                    <TableCell
                                        {...getSelectionCellProps(
                                            worker.id,
                                            'attendance_id',
                                        )}
                                        className="px-4 text-sm font-semibold text-slate-900 dark:text-neutral-100"
                                    >
                                        {`#${worker.attendance_id}`}
                                    </TableCell>

                                    <TableCell
                                        {...getSelectionCellProps(
                                            worker.id,
                                            'total_wage',
                                        )}
                                        className="px-4 text-right text-sm text-slate-600 tabular-nums dark:text-neutral-300"
                                    >
                                        {`${Number(worker.attendance?.total_wage ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`}
                                    </TableCell>

                                    <TableCell
                                        {...getSelectionCellProps(
                                            worker.id,
                                            'amount',
                                        )}
                                        className="px-4 text-right text-sm font-bold text-slate-900 tabular-nums dark:text-neutral-100"
                                    >
                                        {`${Number(worker.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default SaleWorkersTable;
