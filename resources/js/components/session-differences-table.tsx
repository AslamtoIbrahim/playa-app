import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Difference } from '@/types/difference';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

export interface SessionDifferencesTableProps {
    differences: Difference[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}

export function SessionDifferencesTable({
    differences,
    formatCurrency,
    emptyMessage,
}: SessionDifferencesTableProps) {
    return (
        <SessionTableShell>
            <Table>
                <TableHeader className={sessionTableHeaderClass}>
                    <TableRow>
                        <TableHead>Facture / Ligne</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Article</TableHead>

                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Prix réel</TableHead>
                        <TableHead className="text-right">Écart</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {differences.length > 0 ? (
                        differences.map((difference) => (
                            <TableRow key={difference.id}>
                                <TableCell className="font-medium">
                                    {difference.invoice_item?.invoice
                                        ?.invoice_number
                                        ? `#${difference.invoice_item.invoice.invoice_number}`
                                        : `#${difference.invoice_item_id ?? difference.id}`}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {difference.customer?.name || '—'}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {difference.item?.name || '—'}
                                </TableCell>

                                <TableCell className="text-right font-mono">
                                    {difference.unit_count}
                                </TableCell>

                                <TableCell className="text-right font-mono">
                                    {formatCurrency(difference.real_price)}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(difference.total_diff)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <SessionEmptyRow colSpan={6}>
                            {emptyMessage}
                        </SessionEmptyRow>
                    )}
                </TableBody>
            </Table>
        </SessionTableShell>
    );
}

export default SessionDifferencesTable;
