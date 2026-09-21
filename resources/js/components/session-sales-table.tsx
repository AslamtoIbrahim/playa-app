import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Sale } from '@/types/sale';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

export interface SessionSalesTableProps {
    sales: Sale[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}

export function SessionSalesTable({
    sales,
    formatCurrency,
    emptyMessage,
}: SessionSalesTableProps) {
    return (
        <SessionTableShell>
            <Table>
                <TableHeader className={sessionTableHeaderClass}>
                    <TableRow>
                        <TableHead>ID / N°</TableHead>
                        <TableHead>Client</TableHead>

                        <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {sales.length > 0 ? (
                        sales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-medium">
                                    #{sale.id}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {sale.customer?.name || '—'}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(sale.amount)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <SessionEmptyRow colSpan={3}>
                            {emptyMessage}
                        </SessionEmptyRow>
                    )}
                </TableBody>
            </Table>
        </SessionTableShell>
    );
}

export default SessionSalesTable;
