import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FileText, Lock, Plus, ShieldCheck } from 'lucide-react';

import AddInvoiceDialog from '@/components/add-invoice-dialog';
import DeleteInvoiceDialog from '@/components/delete-invoice-dialog';
import EditInvoiceDialog from '@/components/edit-invoice-dialog';
import SellWholeInvoiceDialog from '@/components/sell-whole-invoice-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { computeInvoiceRemainingTotals } from '@/lib/sales';
import { show as showInvoice } from '@/routes/invoices';
import type { Caution } from '@/types/caution';
import type { Customer } from '@/types/customer';
import type { SessionStatus } from '@/types/daily-session';
import type { Billable, Invoice } from '@/types/invoice';
import type { OfficeRoom } from '@/types/office-room';
import type { SessionZone } from '@/types/session-zone';
import {
    SessionInvoiceColumnFilter,
    SessionInvoiceSearch,
    SessionInvoiceTotals,
} from './session-invoice-filters';
import type {
    SessionInvoiceColumnFilterValue,
    SessionInvoiceFilterColumn,
    SessionInvoiceFilters,
} from './session-invoice-filters';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

const initialInvoiceFilters: SessionInvoiceFilters = {
    search: '',
    columns: {},
};

const getInvoiceFilterValue = (
    invoice: Invoice,
    column: SessionInvoiceFilterColumn,
): string | number => {
    switch (column) {
        case 'number':
            return invoice.invoice_number || invoice.id;
        case 'client':
            return invoice.billable?.name || '—';
        case 'caution':
            return invoice.caution?.name || 'Aucune';
        case 'boxes':
            return invoice.boxes || 0;
        case 'weight':
            return invoice.weight || 0;
        case 'amount':
            return invoice.amount || 0;
    }
};

const invoiceFilterOptions = (
    invoices: Invoice[],
    column: SessionInvoiceFilterColumn,
): string[] =>
    [
        ...new Set(
            invoices.map((invoice) =>
                String(getInvoiceFilterValue(invoice, column)),
            ),
        ),
    ].sort((left, right) => left.localeCompare(right, 'fr'));

/**
 * Contexte de la journée courante : il alimente le dialogue de création et les
 * actions de ligne (modifier / archiver).
 * La session, la zone et la date étant déjà connues, seuls le compte et le
 * bureau restent à saisir à la création.
 */
export interface SessionInvoiceAddContext {
    type: 'sale' | 'purchase';
    sessionId: number;
    sessionDate: string;
    sessionStatus: SessionStatus;
    sessionZones: SessionZone[];
    billables: Billable[];
    officeRooms: OfficeRoom[];
    cautions: Caution[];
    /**
     * Clients déjà utilisés par les ventes de la journée : seuls proposés
     * pour vendre une facture en entier à un seul client.
     */
    sellCustomers: Customer[];
    /**
     * All session customers: used to create a missing day sale inline
     * without leaving the sell dialog.
     */
    allCustomers: Customer[];
}

export type SessionInvoiceAddContextInput = Omit<
    SessionInvoiceAddContext,
    'type'
>;

export interface SessionInvoicesTableProps {
    invoices: Invoice[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
    /**
     * Quand fourni : affiche la barre d'outils (bouton de création) ainsi que
     * les icônes de modification / archivage sur chaque ligne.
     */
    invoiceContext?: SessionInvoiceAddContext | null;
}

export function SessionInvoicesTable({
    invoices,
    formatCurrency,
    emptyMessage,
    invoiceContext,
}: SessionInvoicesTableProps) {
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const [filters, setFilters] = useState<SessionInvoiceFilters>(
        initialInvoiceFilters,
    );

    const handleRowClick = (invoiceId: number): void => {
        router.visit(showInvoice.url(invoiceId));
    };

    const canAddInvoice = invoiceContext?.sessionStatus === 'open';

    const filteredInvoices = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return invoices.filter((invoice) => {
            const matchesSearch =
                !query ||
                [
                    `#${invoice.invoice_number || invoice.id}`,
                    invoice.invoice_number,
                    invoice.id,
                    invoice.billable?.name,
                    invoice.caution?.name ?? 'Aucune',
                    invoice.boxes,
                    invoice.weight ?? 0,
                    invoice.amount,
                    formatCurrency(invoice.amount),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    SessionInvoiceFilterColumn,
                    SessionInvoiceColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                const value = getInvoiceFilterValue(invoice, column);

                if (filter.values && filter.values.length > 0) {
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
    }, [filters, formatCurrency, invoices]);

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
        column: SessionInvoiceFilterColumn,
        label: string,
        className?: string,
    ) => (
        <TableHead className={className}>
            <span className="inline-flex items-center gap-1">
                {label}
                <SessionInvoiceColumnFilter
                    title={label}
                    options={
                        column === 'number' ||
                        column === 'client' ||
                        column === 'caution'
                            ? invoiceFilterOptions(invoices, column)
                            : undefined
                    }
                    value={filters.columns[column]}
                    onChange={(value) =>
                        setFilters((current) => ({
                            ...current,
                            columns: {
                                ...current.columns,
                                [column]: value,
                            },
                        }))
                    }
                />
            </span>
        </TableHead>
    );

    return (
        <SessionTableShell
            header={
                invoiceContext ? (
                    <>
                        <SessionInvoiceSearch
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

                        {canAddInvoice ? (
                            <AddInvoiceDialog
                                billables={invoiceContext.billables}
                                officeRooms={invoiceContext.officeRooms}
                                cautions={invoiceContext.cautions}
                                sessionZones={invoiceContext.sessionZones}
                                lockedSessionZoneIds={invoiceContext.sessionZones.map(
                                    (sessionZone) => sessionZone.id,
                                )}
                                lockedDate={invoiceContext.sessionDate}
                                lockedType={invoiceContext.type}
                                redirectTo="session"
                                title={
                                    invoiceContext.type === 'purchase'
                                        ? "Nouvelle Facture d'Achat"
                                        : 'Nouvelle Facture de Vente'
                                }
                                description="La journée, la zone et la date sont déjà définies : choisissez le compte et le bureau."
                                trigger={
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />{' '}
                                        Ajouter une Facture
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
                <Table className="min-w-205">
                    <TableHeader
                        className={`${sessionTableHeaderClass} [&_th]:h-12 [&_th]:bg-slate-50/80 [&_th]:text-[10px] [&_th]:tracking-[0.12em] dark:[&_th]:bg-neutral-950/70 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                    >
                        {hasActiveSearchOrFilters && (
                            <SessionInvoiceTotals
                                invoices={filteredInvoices}
                                formatCurrency={formatCurrency}
                            />
                        )}
                        <TableRow>
                            {columnHeader('number', 'ID / N°')}
                            {columnHeader('client', 'Clients')}
                            {columnHeader('caution', 'Caution')}
                            {columnHeader('boxes', 'NC', 'text-center')}
                            {columnHeader('weight', 'Poids Kg', 'text-center')}
                            {columnHeader('amount', 'Montant', 'text-right')}

                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredInvoices.length > 0 ? (
                            filteredInvoices.map((invoice) => (
                                <TableRow
                                    key={invoice.id}
                                    onClick={() => {
                                        handleRowClick(invoice.id);
                                    }}
                                    className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-100/70 dark:border-neutral-800/70 dark:hover:bg-blue-950/20"
                                >
                                    <TableCell className="py-2">
                                        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-neutral-200">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 ring-1 ring-blue-200 transition-colors group-hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/50 dark:group-hover:bg-blue-900/50">
                                                <FileText className="h-4 w-4" />
                                            </span>
                                            #
                                            {invoice.invoice_number ||
                                                invoice.id}
                                        </span>
                                    </TableCell>

                                    <TableCell className="font-semibold text-slate-800 dark:text-neutral-200">
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
                                            <span className="text-xs text-slate-400 dark:text-neutral-500">
                                                Aucune
                                            </span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <span className="inline-flex min-w-9 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 tabular-nums dark:bg-neutral-800 dark:text-neutral-300">
                                            {invoice.boxes || 0}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <span className="text-sm font-semibold text-slate-700 tabular-nums dark:text-neutral-300">
                                            {invoice.weight || 0}
                                            <span className="ml-1 text-[10px] font-medium text-slate-400">
                                                kg
                                            </span>
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right font-mono text-sm font-bold text-slate-900 tabular-nums dark:text-neutral-100">
                                        {formatCurrency(invoice.amount)}
                                    </TableCell>

                                    <TableCell
                                        className="text-right"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                    >
                                        {invoiceContext ? (
                                            <div className="flex items-center justify-end gap-1">
                                                {invoiceContext.type ===
                                                    'purchase' &&
                                                    canAddInvoice &&
                                                    (invoice.items?.length ??
                                                        0) > 0 && (
                                                        <SellWholeInvoiceDialog
                                                            invoice={invoice}
                                                            customers={
                                                                invoiceContext.sellCustomers
                                                            }
                                                            allCustomers={
                                                                invoiceContext.allCustomers
                                                            }
                                                            formatCurrency={
                                                                formatCurrency
                                                            }
                                                            sessionId={
                                                                invoiceContext.sessionId
                                                            }
                                                            sessionDate={
                                                                invoiceContext.sessionDate
                                                            }
                                                            disabled={
                                                                !computeInvoiceRemainingTotals(
                                                                    invoice,
                                                                ).hasRemaining
                                                            }
                                                        />
                                                    )}

                                                <EditInvoiceDialog
                                                    invoice={invoice}
                                                    billables={
                                                        invoiceContext.billables
                                                    }
                                                    sessionZones={
                                                        invoiceContext.sessionZones
                                                    }
                                                    cautions={
                                                        invoiceContext.cautions
                                                    }
                                                    officeRooms={
                                                        invoiceContext.officeRooms
                                                    }
                                                />

                                                <DeleteInvoiceDialog
                                                    invoiceId={invoice.id}
                                                    invoiceNumber={
                                                        invoice.invoice_number
                                                    }
                                                    amount={invoice.amount}
                                                />
                                            </div>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <SessionEmptyRow colSpan={7}>
                                {invoices.length === 0
                                    ? emptyMessage
                                    : 'Aucune facture ne correspond à la recherche ou aux filtres.'}
                            </SessionEmptyRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </SessionTableShell>
    );
}

export default SessionInvoicesTable;
