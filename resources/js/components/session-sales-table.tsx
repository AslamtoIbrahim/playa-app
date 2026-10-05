import { router } from '@inertiajs/react';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';

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
        router.visit(showSale.url(saleId));
    };

    return (
        <SessionTableShell
            header={
                saleContext ? (
                    <>
                        <span className="text-xs font-bold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                            {title} ({sales.length})
                        </span>

                        {canAddSale ? (
                            <AddSaleDialog
                                customers={saleContext.customers}
                                lockedSessionId={saleContext.sessionId}
                                lockedDate={saleContext.sessionDate}
                                title="Nouvelle Vente"
                                description="La journée et la date sont déjà définies : choisissez le client et le type de vente."
                                trigger={
                                    <Button size="sm" className="font-bold">
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
            <Table>
                <TableHeader className={sessionTableHeaderClass}>
                    <TableRow>
                        <TableHead>ID / N°</TableHead>
                        <TableHead>Client</TableHead>

                        <TableHead className="text-right">Montant</TableHead>

                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {sales.length > 0 ? (
                        sales.map((sale) => (
                            <TableRow
                                key={sale.id}
                                className="cursor-pointer"
                                onClick={() => handleRowClick(sale.id)}
                            >
                                <TableCell className="font-medium">
                                    #{sale.id}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {sale.customer?.name || '—'}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(sale.amount)}
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
        </SessionTableShell>
    );
}

export default SessionSalesTable;
