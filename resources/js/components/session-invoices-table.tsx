import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FileText, Filter, Lock, Plus, ShieldCheck } from 'lucide-react';

import AddInvoiceDialog from '@/components/add-invoice-dialog';
import DeleteInvoiceDialog from '@/components/delete-invoice-dialog';
import EditInvoiceDialog from '@/components/edit-invoice-dialog';
import { InvoiceGlobalSearch } from '@/components/invoice-item-filters';
import SellWholeInvoiceDialog from '@/components/sell-whole-invoice-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { computeInvoiceRemainingTotals } from '@/lib/sales';
import { show as showInvoice } from '@/routes/invoices';
import type { Caution } from '@/types/caution';
import type { Customer } from '@/types/customer';
import type { SessionStatus } from '@/types/daily-session';
import type { Billable, Invoice } from '@/types/invoice';
import type { OfficeRoom } from '@/types/office-room';
import type { SessionZone } from '@/types/session-zone';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

type SessionInvoiceFilterColumn =
    | 'number'
    | 'client'
    | 'caution'
    | 'boxes'
    | 'weight'
    | 'amount';

interface SessionInvoiceColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

interface SessionInvoiceFilters {
    search: string;
    columns: Partial<
        Record<SessionInvoiceFilterColumn, SessionInvoiceColumnFilterValue>
    >;
}

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
                        <InvoiceGlobalSearch
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

interface SessionInvoiceColumnFilterProps {
    title: string;
    options?: string[];
    value?: SessionInvoiceColumnFilterValue;
    onChange: (value: SessionInvoiceColumnFilterValue) => void;
}

function SessionInvoiceColumnFilter({
    title,
    options,
    value,
    onChange,
}: SessionInvoiceColumnFilterProps) {
    const active = Boolean(
        value && ((value.values?.length ?? 0) > 0 || value.min || value.max),
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    data-column-filter-trigger
                    aria-label={`Filtrer : ${title}`}
                    title={`Filtrer : ${title}`}
                    className={cn(
                        'ml-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        active &&
                            'bg-primary/15 text-primary ring-1 ring-primary/20',
                    )}
                >
                    <Filter className="size-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-64 gap-3 rounded-xl border-border/70 p-3 shadow-lg"
            >
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Filtrer : {title}</p>
                    {active && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                                onChange({ values: [], min: '', max: '' })
                            }
                        >
                            Effacer
                        </Button>
                    )}
                </div>
                {options ? (
                    <div className="max-h-52 space-y-1 overflow-y-auto">
                        {options.map((option) => {
                            const checked =
                                value?.values?.includes(option) ?? false;

                            return (
                                <label
                                    key={option}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/70"
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={(checked) =>
                                            onChange({
                                                values: checked
                                                    ? [
                                                          ...(value?.values ??
                                                              []),
                                                          option,
                                                      ]
                                                    : (
                                                          value?.values ?? []
                                                      ).filter(
                                                          (entry) =>
                                                              entry !== option,
                                                      ),
                                                min: value?.min ?? '',
                                                max: value?.max ?? '',
                                            })
                                        }
                                    />
                                    <span className="truncate">{option}</span>
                                </label>
                            );
                        })}
                        {options.length === 0 && (
                            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                                Aucune valeur disponible
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            aria-label={`${title} minimum`}
                            placeholder="Minimum"
                            value={value?.min ?? ''}
                            onChange={(event) =>
                                onChange({
                                    values: [],
                                    min: event.target.value,
                                    max: value?.max ?? '',
                                })
                            }
                            className="h-9"
                        />
                        <Input
                            type="number"
                            aria-label={`${title} maximum`}
                            placeholder="Maximum"
                            value={value?.max ?? ''}
                            onChange={(event) =>
                                onChange({
                                    values: [],
                                    min: value?.min ?? '',
                                    max: event.target.value,
                                })
                            }
                            className="h-9"
                        />
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

export default SessionInvoicesTable;
