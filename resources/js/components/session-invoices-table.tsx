import { router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { show as showInvoice } from '@/routes/invoices';
import type { Invoice } from '@/types/invoice';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

export interface SessionInvoicesTableProps {
    invoices: Invoice[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}

export function SessionInvoicesTable({
    invoices,
    formatCurrency,
    emptyMessage,
}: SessionInvoicesTableProps) {
    const handleRowClick = (invoiceId: number): void => {
        router.visit(showInvoice.url(invoiceId));
    };

    return (
        <SessionTableShell>
            <Table>
                <TableHeader className={sessionTableHeaderClass}>
                    <TableRow>
                        <TableHead>ID / N°</TableHead>
                        <TableHead>Client / Fournisseur</TableHead>
                        <TableHead>Caution</TableHead>

                        <TableHead className="text-center">NC</TableHead>

                        <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <TableRow
                                key={invoice.id}
                                onClick={() => {
                                    handleRowClick(invoice.id);
                                }}
                                className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                            >
                                <TableCell className="font-medium">
                                    {invoice.invoice_number
                                        ? `#${invoice.invoice_number}`
                                        : `#${invoice.id}`}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {invoice.billable?.name || '—'}
                                </TableCell>

                                <TableCell>
                                    {invoice.caution ? (
                                        <div className="flex w-fit items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-400">
                                            <ShieldCheck className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />

                                            <span className="max-w-30 truncate">
                                                {invoice.caution.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-neutral-300 dark:text-neutral-600">
                                            Aucune
                                        </span>
                                    )}
                                </TableCell>

                                <TableCell className="text-center font-bold text-neutral-700 dark:text-neutral-300">
                                    {invoice.boxes || 0}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(invoice.amount)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <SessionEmptyRow colSpan={5}>
                            {emptyMessage}
                        </SessionEmptyRow>
                    )}
                </TableBody>
            </Table>
        </SessionTableShell>
    );
}

export default SessionInvoicesTable;
