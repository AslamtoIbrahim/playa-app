import { router } from '@inertiajs/react';
import { CalendarDays, Ship } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import type { DifferenceReport } from '@/lib/differences';
import { groupDifferencesByReport } from '@/lib/differences';
import { report as differenceReport } from '@/routes/differences';
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
    sessionId: number;
}

export function SessionDifferencesTable({
    differences,
    formatCurrency,
    emptyMessage,
    sessionId,
}: SessionDifferencesTableProps) {
    const reports = groupDifferencesByReport(differences);

    const openReport = (item: DifferenceReport): void => {
        if (!item.invoiceDate || !item.boatId) {
            return;
        }

        router.visit(
            differenceReport.url({
                query: {
                    customer_id: item.customerId,
                    date: item.invoiceDate,
                    boat_id: item.boatId,
                    from_session: sessionId,
                },
            }),
        );
    };

    return (
        <SessionTableShell>
            <div className="overflow-x-auto">
                <Table className="min-w-[680px]">
                    <TableHeader
                        className={`${sessionTableHeaderClass} [&_th]:h-12 [&_th]:bg-slate-50/80 [&_th]:text-[10px] [&_th]:tracking-[0.12em] dark:[&_th]:bg-neutral-950/70`}
                    >
                        <TableRow>
                            <TableHead>Date Facture</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-center">
                                Bateau
                            </TableHead>

                            <TableHead className="text-right">
                                Total Écart
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {reports.length > 0 ? (
                            reports.map((item) => (
                                <TableRow
                                    key={item.key}
                                    title={`${item.itemsCount} ligne(s) d'écart`}
                                    onClick={() => {
                                        openReport(item);
                                    }}
                                    className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-50/50 dark:border-neutral-800/70 dark:hover:bg-blue-950/20"
                                >
                                    <TableCell className="py-4 text-sm font-semibold text-slate-700 dark:text-neutral-300">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/50">
                                                <CalendarDays className="h-4 w-4" />
                                            </span>
                                            {formatDateDisplay(
                                                item.invoiceDate,
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell className="font-semibold text-slate-800 capitalize dark:text-neutral-200">
                                        {item.customerName}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-neutral-600 uppercase dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                <Ship className="h-3 w-3 text-neutral-500 dark:text-neutral-400" />
                                                {item.boatName}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <span
                                            className={`text-base font-black tabular-nums ${
                                                item.totalDiff >= 0
                                                    ? 'text-neutral-900 dark:text-neutral-100'
                                                    : 'text-rose-600 dark:text-rose-400'
                                            }`}
                                        >
                                            {item.totalDiff > 0 ? '+' : ''}
                                            {formatCurrency(item.totalDiff)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <SessionEmptyRow colSpan={4}>
                                {emptyMessage}
                            </SessionEmptyRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </SessionTableShell>
    );
}

export default SessionDifferencesTable;
