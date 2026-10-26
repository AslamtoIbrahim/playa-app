import { CircleCheck, FileText, Hourglass, Lock, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import AddReceiptDialog from '@/components/add-receipt-dialog';
import DeleteReceiptDialog from '@/components/delete-receipt-dialog';
import EditReceiptDialog from '@/components/edit-receipt-dialog';
import SellReceiptDialog from '@/components/sell-receipt-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { computeReceiptRemainingAmount } from '@/lib/sales';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Boat } from '@/types/boat';
import type { Customer } from '@/types/customer';
import type { DailySession, SessionStatus } from '@/types/daily-session';
import type { Receipt } from '@/types/receipt';
import type { Sale } from '@/types/sale';
import type { SessionZone } from '@/types/session-zone';
import { show as showReceipt } from '@/routes/receipts';
import {
    SessionReceiptColumnFilter,
    SessionReceiptColumnTotals,
    SessionReceiptSearch,
} from './session-receipt-filters';
import type {
    SessionReceiptColumnFilterValue,
    SessionReceiptFilterColumn,
    SessionReceiptFilters,
} from './session-receipt-filters';

import {
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

const initialReceiptFilters: SessionReceiptFilters = {
    search: '',
    columns: {},
};

const getRemainingAmount = (receipt: Receipt): number =>
    Math.max(computeReceiptRemainingAmount(receipt), 0);

const getReceiptFilterValue = (
    receipt: Receipt,
    column: SessionReceiptFilterColumn,
    getRemainingAmount: (receipt: Receipt) => number,
): string | number => {
    switch (column) {
        case 'number':
            return receipt.id;
        case 'supplier':
            return receipt.boat?.name || receipt.customer?.name || '—';
        case 'amount':
            return receipt.total_amount || 0;
        case 'remaining':
            return getRemainingAmount(receipt);
    }
};

const receiptFilterOptions = (
    receipts: Receipt[],
    column: SessionReceiptFilterColumn,
    getRemainingAmount: (receipt: Receipt) => number,
): string[] =>
    [
        ...new Set(
            receipts.map((receipt) =>
                String(
                    getReceiptFilterValue(receipt, column, getRemainingAmount),
                ),
            ),
        ),
    ].sort((left, right) => left.localeCompare(right, 'fr'));

/**
 * Contexte de la journée courante : il alimente le dialogue de création et les
 * actions de ligne (modifier / supprimer). La session, la zone et la date étant
 * déjà connues, seuls le client et le bateau restent à saisir à la création.
 */
export interface SessionReceiptAddContext {
    sessionId: number;
    sessionDate: string;
    sessionStatus: SessionStatus;
    sessionZones: SessionZone[];
    customers: Customer[];
    boats: Boat[];
}

export type SessionReceiptAddContextInput = SessionReceiptAddContext;

export interface SessionReceiptsTableProps {
    receipts: Receipt[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
    /**
     * Quand fourni : affiche la barre d'outils (bouton de création) ainsi que
     * les icônes de modification / suppression sur chaque ligne.
     */
    receiptContext?: SessionReceiptAddContext | null;
    /** Ventes de la journée : cibles possibles pour vendre un bon. */
    sales?: Sale[];
    /** Session courante pour créer la vente manquante depuis le dialogue. */
    session?: DailySession | null;
}

export function SessionReceiptsTable({
    receipts,
    formatCurrency,
    emptyMessage,
    receiptContext,
    sales = [],
    session = null,
}: SessionReceiptsTableProps) {
    const canAddReceipt = receiptContext?.sessionStatus === 'open';
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const [filters, setFilters] = useState<SessionReceiptFilters>(
        initialReceiptFilters,
    );

    // Ouvrir la fiche du bon : c'est là que les articles sont saisis.
    const handleRowClick = (receiptId: number): void => {
        router.visit(
            showReceipt.url(
                receiptId,
                receiptContext
                    ? { query: { from_session: receiptContext.sessionId } }
                    : undefined,
            ),
        );
    };

    const filteredReceipts = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return receipts.filter((receipt) => {
            const remaining = getRemainingAmount(receipt);
            const matchesSearch =
                !query ||
                [
                    `#${receipt.id}`,
                    receipt.id,
                    receipt.boat?.name,
                    receipt.customer?.name,
                    receipt.total_amount,
                    formatCurrency(receipt.total_amount),
                    remaining,
                    formatCurrency(remaining),
                    remaining <= 0.005 ? 'Terminée' : 'En cours',
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    SessionReceiptFilterColumn,
                    SessionReceiptColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                const value = getReceiptFilterValue(
                    receipt,
                    column,
                    getRemainingAmount,
                );

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
    }, [filters, formatCurrency, receipts]);

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
        column: SessionReceiptFilterColumn,
        label: string,
        className?: string,
    ) => (
        <TableHead className={className}>
            <span className="inline-flex items-center gap-1">
                {label}
                <SessionReceiptColumnFilter
                    title={label}
                    options={
                        column === 'number' || column === 'supplier'
                            ? receiptFilterOptions(
                                  receipts,
                                  column,
                                  getRemainingAmount,
                              )
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
                receiptContext ? (
                    <>
                        <SessionReceiptSearch
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

                        {canAddReceipt ? (
                            <AddReceiptDialog
                                customers={receiptContext.customers}
                                sessionZones={receiptContext.sessionZones}
                                boats={receiptContext.boats}
                                lockedSessionZoneIds={receiptContext.sessionZones.map(
                                    (sessionZone) => sessionZone.id,
                                )}
                                lockedDate={receiptContext.sessionDate}
                                title="Nouveau Bon de Réception"
                                description="La journée, la zone et la date sont déjà définies : choisissez le client et le bateau."
                                trigger={
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />{' '}
                                        Nouveau Bon
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
                <Table className="min-w-[680px]">
                    <TableHeader
                        className={`${sessionTableHeaderClass} [&_th]:h-12 [&_th]:bg-slate-50/80 [&_th]:text-[10px] [&_th]:tracking-[0.12em] dark:[&_th]:bg-neutral-950/70 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                    >
                        {hasActiveSearchOrFilters && (
                            <SessionReceiptColumnTotals
                                receipts={filteredReceipts}
                                getRemainingAmount={getRemainingAmount}
                                formatCurrency={formatCurrency}
                            />
                        )}
                        <TableRow>
                            {columnHeader('number', 'Bon N°')}
                            {columnHeader('supplier', 'Bateau / Fournisseur')}
                            {columnHeader(
                                'amount',
                                'Montant total',
                                'text-right',
                            )}
                            {columnHeader('remaining', 'Reste', 'text-right')}
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredReceipts.length > 0 ? (
                            filteredReceipts.map((receipt) => (
                                <TableRow
                                    key={receipt.id}
                                    className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-100/70 dark:border-neutral-800/70 dark:hover:bg-blue-950/20"
                                    onClick={() => handleRowClick(receipt.id)}
                                >
                                    <TableCell className="py-4">
                                        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-neutral-200">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 ring-1 ring-blue-200 group-hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/50 dark:group-hover:bg-blue-900/50">
                                                <FileText className="h-4 w-4" />
                                            </span>
                                            #{receipt.id}
                                        </span>
                                    </TableCell>

                                    <TableCell className="font-semibold text-slate-800 dark:text-neutral-200">
                                        {receipt.boat?.name ||
                                            receipt.customer?.name ||
                                            '—'}
                                    </TableCell>

                                    <TableCell className="text-right font-mono text-sm font-bold text-slate-900 tabular-nums dark:text-neutral-100">
                                        {formatCurrency(receipt.total_amount)}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        {(() => {
                                            const sold = (
                                                receipt.sale_charges ?? []
                                            ).reduce(
                                                (sum, charge) =>
                                                    sum +
                                                    Number(charge.amount || 0),
                                                0,
                                            );

                                            const rest =
                                                Number(
                                                    receipt.total_amount || 0,
                                                ) - sold;
                                            const clampedRest = Math.max(
                                                rest,
                                                0,
                                            );
                                            const isCompleted =
                                                clampedRest <= 0.005;

                                            return (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums',
                                                        isCompleted
                                                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400'
                                                            : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400',
                                                    )}
                                                >
                                                    {isCompleted ? (
                                                        <CircleCheck className="h-3 w-3" />
                                                    ) : (
                                                        <Hourglass className="h-3 w-3" />
                                                    )}

                                                    {isCompleted
                                                        ? 'Terminée'
                                                        : formatCurrency(
                                                              clampedRest,
                                                          )}
                                                </Badge>
                                            );
                                        })()}
                                    </TableCell>

                                    <TableCell
                                        className="text-right"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                    >
                                        {receiptContext?.sessionStatus ===
                                        'open' ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <SellReceiptDialog
                                                    receipt={receipt}
                                                    sales={sales}
                                                    session={session}
                                                    customers={
                                                        receiptContext.customers
                                                    }
                                                />

                                                <EditReceiptDialog
                                                    receipt={receipt}
                                                    customers={
                                                        receiptContext.customers
                                                    }
                                                    sessionZones={
                                                        receiptContext.sessionZones
                                                    }
                                                    boats={receiptContext.boats}
                                                    lockedSessionZoneIds={receiptContext.sessionZones.map(
                                                        (sessionZone) =>
                                                            sessionZone.id,
                                                    )}
                                                    lockedDate={
                                                        receiptContext.sessionDate
                                                    }
                                                />

                                                <DeleteReceiptDialog
                                                    receiptId={receipt.id}
                                                    amount={
                                                        receipt.total_amount
                                                    }
                                                    saleCharges={
                                                        receipt.sale_charges ??
                                                        []
                                                    }
                                                />
                                            </div>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center text-sm text-muted-foreground"
                                >
                                    {receipts.length === 0
                                        ? emptyMessage
                                        : 'Aucun bon ne correspond à la recherche ou aux filtres.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </SessionTableShell>
    );
}

export default SessionReceiptsTable;
