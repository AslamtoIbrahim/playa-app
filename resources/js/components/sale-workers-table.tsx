import { Card, CardContent } from '@/components/ui/card';
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
export function SaleWorkersTable({ workers, className }: SaleWorkersTableProps) {
    if (workers.length === 0) {
        return null;
    }

    return (
        <Card
            className={cn(
                'w-full overflow-hidden border-slate-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
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
                                <TableRow key={worker.id} className="h-11">
                                    <TableCell className="px-4 text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                        {`#${worker.attendance_id}`}
                                    </TableCell>

                                    <TableCell className="px-4 text-right text-sm text-slate-600 dark:text-neutral-300">
                                        {`${Number(worker.attendance?.total_wage ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`}
                                    </TableCell>

                                    <TableCell className="px-4 text-right text-sm font-bold text-slate-900 dark:text-neutral-100">
                                        {`${Number(worker.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`}
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
