import { router } from '@inertiajs/react';
import { Lock, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react';

import AddSaleDialog from '@/components/add-sale-dialog';
import DeleteSaleDialog from '@/components/delete-sale-dialog';
import EditSaleDialog from '@/components/edit-sale-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { show as showSale } from '@/routes/sales';
import { computeSaleNetToPayFromSale } from '@/lib/sales';
import type { Customer } from '@/types/customer';
import type { SessionStatus } from '@/types/daily-session';
import type { Sale } from '@/types/sale';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

/**
 * Context of the current daily session: it feeds the creation dialog and the
 * row actions (edit / delete). The session and its date being already known,
 * only the customer and the sale type remain to be filled in.
 */
export interface SessionSaleAddContext {
    sessionId: number;
    sessionDate: string;
    sessionStatus: SessionStatus;
    customers: Customer[];
}

export type SessionSaleAddContextInput = SessionSaleAddContext;

export interface SessionSalesTableProps {
    sales: Sale[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
    /**
     * When provided: renders the toolbar (creation button) as well as the
     * edit / delete icons on each row.
     */
    saleContext?: SessionSaleAddContext | null;
    title?: string;
}

export function SessionSalesTable({
    sales,
    formatCurrency,
    emptyMessage,
    saleContext,
    title = 'Ventes',
}: SessionSalesTableProps) {
    const canAddSale = saleContext?.sessionStatus === 'open';

    // Open the sale sheet: this is where the items are assigned.
    const handleRowClick = (saleId: number): void => {
        router.visit(
            showSale.url(
                saleId,
                saleContext
                    ? { query: { from_session: saleContext.sessionId } }
                    : undefined,
            ),
        );
    };

    return (
        <SessionTableShell
            header={
                saleContext ? (
                    <>
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300">
                                <ReceiptText className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-neutral-100">
                                    {title}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-neutral-400">
                                    {sales.length} vente
                                    {sales.length > 1 ? 's' : ''} enregistrée
                                    {sales.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {canAddSale ? (
                            <AddSaleDialog
                                customers={saleContext.customers}
                                lockedSessionId={saleContext.sessionId}
                                lockedDate={saleContext.sessionDate}
                                title="Nouvelle Vente"
                                description="La journée et la date sont déjà définies : choisissez le client et le type de vente."
                                trigger={
                                    <Button
                                        size="sm"
                                        className="bg-orange-600 font-bold text-white shadow-sm hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />{' '}
                                        Nouvelle Vente
                                    </Button>
                                }
                            />
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="font-bold dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                            >
                                <Lock className="mr-2 h-4 w-4" /> Journée
                                clôturée
                            </Button>
                        )}
                    </>
                ) : null
            }
        >
            <div className="overflow-x-auto">
                <Table className="min-w-160">
                    <TableHeader
                        className={`${sessionTableHeaderClass} [&_th]:h-12 [&_th]:bg-orange-50/70 [&_th]:text-[10px] [&_th]:tracking-[0.12em] dark:[&_th]:bg-orange-950/20`}
                    >
                        <TableRow>
                            <TableHead>ID / N°</TableHead>
                            <TableHead>Clients</TableHead>

                            <TableHead className="text-right">
                                Montant
                            </TableHead>

                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {sales.length > 0 ? (
                            sales.map((sale) => (
                                <TableRow
                                    key={sale.id}
                                    className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-orange-50/60 dark:border-neutral-800/70 dark:hover:bg-orange-950/20"
                                    onClick={() => handleRowClick(sale.id)}
                                >
                                    <TableCell className="py-4">
                                        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-neutral-200">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 group-hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900/50 dark:group-hover:bg-orange-900/50">
                                                <ReceiptText className="h-4 w-4" />
                                            </span>
                                            #{sale.id}
                                        </span>
                                    </TableCell>

                                    <TableCell className="font-semibold text-slate-800 dark:text-neutral-200">
                                        {sale.customer?.name || '—'}
                                    </TableCell>

                                    <TableCell className="text-right font-mono text-sm font-bold text-slate-900 tabular-nums dark:text-neutral-100">
                                        {formatCurrency(
                                            Math.abs(
                                                computeSaleNetToPayFromSale(
                                                    sale,
                                                ),
                                            ),
                                        )}
                                    </TableCell>

                                    <TableCell
                                        className="text-right"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                    >
                                        {saleContext ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <EditSaleDialog
                                                    sale={sale}
                                                    customers={
                                                        saleContext.customers
                                                    }
                                                    lockedSessionId={
                                                        saleContext.sessionId
                                                    }
                                                    lockedDate={
                                                        saleContext.sessionDate
                                                    }
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />

                                                <DeleteSaleDialog
                                                    saleId={sale.id}
                                                    amount={sale.amount}
                                                    customerName={
                                                        sale.customer?.name ||
                                                        'Client Inconnu'
                                                    }
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/70 dark:hover:text-red-400"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        ) : null}
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

export default SessionSalesTable;
