import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
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
import {
    groupDifferencesByReport,
    groupSessionDifferencesByReport,
} from '@/lib/differences';
import { report as differenceReport } from '@/routes/differences';
import type { Difference } from '@/types/difference';
import type { Receipt } from '@/types/receipt';
import {
    SessionDifferenceColumnFilter,
    SessionDifferenceColumnTotals,
    SessionDifferenceSearch,
} from './session-difference-filters';
import type {
    SessionDifferenceColumnFilterValue,
    SessionDifferenceFilterColumn,
    SessionDifferenceFilters,
} from './session-difference-filters';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

const initialFilters: SessionDifferenceFilters = { search: '', columns: {} };

const getFilterValue = (
    report: DifferenceReport,
    column: SessionDifferenceFilterColumn,
): string | number => {
    switch (column) {
        case 'date':
            return report.invoiceDate ?? '—';
        case 'client':
            return report.customerName;
        case 'boat':
            return report.boatName;
        case 'total':
            return report.totalDiff;
    }
};

export interface SessionDifferencesTableProps {
    differences: Difference[];
    receipts: Receipt[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
    sessionId: number;
}

export function SessionDifferencesTable({
    differences,
    receipts,
    formatCurrency,
    emptyMessage,
    sessionId,
}: SessionDifferencesTableProps) {
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const [filters, setFilters] =
        useState<SessionDifferenceFilters>(initialFilters);
    const reports = useMemo(() => {
        const reportsWithCommissions = groupSessionDifferencesByReport(
            differences,
            receipts,
        );
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return reportsWithCommissions.filter((report) => {
            const matchesSearch =
                !query ||
                [
                    report.invoiceDate,
                    formatDateDisplay(report.invoiceDate),
                    report.customerName,
                    report.boatName,
                    report.totalDiff,
                    formatCurrency(report.totalDiff),
                    report.itemsCount,
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    SessionDifferenceFilterColumn,
                    SessionDifferenceColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                const value = getFilterValue(report, column);

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
    }, [differences, receipts, filters, formatCurrency]);
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
        column: SessionDifferenceFilterColumn,
        label: string,
        className?: string,
    ) => (
        <TableHead className={className}>
            <span className="inline-flex items-center gap-1">
                {label}
                <SessionDifferenceColumnFilter
                    title={label}
                    options={
                        column === 'client' || column === 'boat'
                            ? [
                                  ...new Set(
                                      groupDifferencesByReport(differences).map(
                                          (report) =>
                                              String(
                                                  getFilterValue(
                                                      report,
                                                      column,
                                                  ),
                                              ),
                                      ),
                                  ),
                              ].sort((left, right) =>
                                  left.localeCompare(right, 'fr'),
                              )
                            : undefined
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
        <SessionTableShell
            header={
                <SessionDifferenceSearch
                    value={filters.search}
                    onChange={(search) =>
                        setFilters((current) => ({ ...current, search }))
                    }
                    showColumnFilters={showColumnFilters}
                    activeFilterCount={activeFilterCount}
                    onToggleColumnFilters={toggleColumnFilters}
                />
            }
        >
            <div className="overflow-x-auto">
                <Table className="min-w-[680px]">
                    <TableHeader
                        className={`${sessionTableHeaderClass} [&_th]:h-12 [&_th]:bg-slate-50/80 [&_th]:text-[10px] [&_th]:tracking-[0.12em] dark:[&_th]:bg-neutral-950/70 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                    >
                        {hasActiveSearchOrFilters && (
                            <SessionDifferenceColumnTotals
                                reports={reports}
                                formatCurrency={formatCurrency}
                            />
                        )}
                        <TableRow>
                            {columnHeader('date', 'Date Facture')}
                            {columnHeader('client', 'Client')}
                            {columnHeader('boat', 'Bateau', 'text-center')}
                            {columnHeader('total', 'Total Écart', 'text-right')}
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
                                    className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-100/70 dark:border-neutral-800/70 dark:hover:bg-blue-950/20"
                                >
                                    <TableCell className="py-4 text-sm font-semibold text-slate-700 dark:text-neutral-300">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/50">
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
