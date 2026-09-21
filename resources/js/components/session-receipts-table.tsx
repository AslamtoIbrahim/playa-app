import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Receipt } from '@/types/receipt';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

export interface SessionReceiptsTableProps {
    receipts: Receipt[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}

export function SessionReceiptsTable({
    receipts,
    formatCurrency,
    emptyMessage,
}: SessionReceiptsTableProps) {
    return (
        <SessionTableShell>
            <Table>
                <TableHeader className={sessionTableHeaderClass}>
                    <TableRow>
                        <TableHead>Bon N°</TableHead>
                        <TableHead>Bateau / Fournisseur</TableHead>

                        <TableHead className="text-right">
                            Montant total
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {receipts.length > 0 ? (
                        receipts.map((receipt) => (
                            <TableRow key={receipt.id}>
                                <TableCell className="font-medium">
                                    #{receipt.id}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {receipt.boat?.name ||
                                        receipt.customer?.name ||
                                        '—'}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(receipt.total_amount)}
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

export default SessionReceiptsTable;
