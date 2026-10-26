import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
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
    SessionSaleColumnFilter,
    SessionSaleSearch,
    SessionSalesColumnTotals,
} from './session-sale-filters';
import type {
    SessionSaleColumnFilterValue,
    SessionSaleFilterColumn,
    SessionSaleFilters,
} from './session-sale-filters';

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

const initialSaleFilters: SessionSaleFilters = { search: '', columns: {} };

const getSaleFilterValue = (
    sale: Sale,
    column: SessionSaleFilterColumn,
): string | number => {
    switch (column) {
        case 'number':
            return sale.id;
        case 'client':
            return sale.customer?.name || '—';
        case 'amount':
            return Math.abs(computeSaleNetToPayFromSale(sale));
    }
};

const saleFilterOptions = (
    sales: Sale[],
    column: SessionSaleFilterColumn,
): string[] =>
    [
        ...new Set(
            sales.map((sale) => String(getSaleFilterValue(sale, column))),
        ),
    ].sort((left, right) => left.localeCompare(right, 'fr'));

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
}: SessionSalesTableProps) {
    const canAddSale = saleContext?.sessionStatus === 'open';
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const [filters, setFilters] =
        useState<SessionSaleFilters>(initialSaleFilters);

    const filteredSales = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return sales.filter((sale) => {
            const amount = Math.abs(computeSaleNetToPayFromSale(sale));
            const matchesSearch =
                !query ||
                [
                    `#${sale.id}`,
                    sale.id,
                    sale.customer?.name,
                    sale.type,
                    amount,
                    formatCurrency(amount),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );
            const matchesColumns = (
                Object.entries(filters.columns) as [
                    SessionSaleFilterColumn,
                    SessionSaleColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                const value = getSaleFilterValue(sale, column);

                if (filter.values?.length) {
                    return filter.values.includes(String(value));
                }

                if (filter.min || filter.max) {
                    const numericValue = Number(value);

                    return (
                        (!filter.min || numericValue >= Number(filter.min)) &&
                        (!filter.max || numericValue <= Number(filter.max))
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [filters, formatCurrency, sales]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;
    const hasActiveSearchOrFilters =
        filters.search.trim().length > 0 || activeFilterCount > 0;

    const toggleColumnFilters = () => {
        if (showColumnFilters) {
            setFilters((current) => ({ ...current, columns: {} }));
            setShowColumnFilters(false);

            return;
        }

        setShowColumnFilters(true);
    };

    const columnHeader = (
        column: SessionSaleFilterColumn,
        label: string,
        className?: string,
    ) => (
        <TableHead className={className}>
            <span className="inline-flex items-center gap-1">
                {label}
                <SessionSaleColumnFilter
                    title={label}
                    options={
                        column === 'amount'
                            ? undefined
                            : saleFilterOptions(sales, column)
                    }
                    value={filters.columns[column]}
                    onChange={(value) =>
                        setFilters((current) => ({
                            ...current,
                            columns: { ...current.columns, [column]: value },
                        }))
                    }
                />
            </span>
        </TableHead>
    );

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
                        <SessionSaleSearch
                            value={filters.search}
                            onChange={(search) =>
                                setFilters((current) => ({
                                    ...current,
                                    search,
                                }))
                            }
                            showColumnFilters={showColumnFilters}
                            activeFilterCount={activeFilterCount}
                            onToggleColumnFilters={toggleColumnFilters}
                        />

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
                        className={`${sessionTableHeaderClass} [&_th]:h-12 [&_th]:bg-orange-50/70 [&_th]:text-[10px] [&_th]:tracking-[0.12em] dark:[&_th]:bg-orange-950/20 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                    >
                        {hasActiveSearchOrFilters && (
                            <SessionSalesColumnTotals
                                sales={filteredSales}
                                formatCurrency={formatCurrency}
                            />
                        )}
                        <TableRow>
                            {columnHeader('number', 'ID / N°')}
                            {columnHeader('client', 'Clients')}
                            {columnHeader('amount', 'Montant', 'text-right')}

                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredSales.length > 0 ? (
                            filteredSales.map((sale) => (
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
                                                            className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
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
