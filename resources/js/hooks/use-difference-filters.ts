import { formatDateDisplay } from '@/lib/date';
import { useMemo, useState } from 'react';

export interface DifferenceReport {
    id: number;
    customer_id: number;
    invoice_date: string;
    boat_id: number;
    total_diff_amount: number;
    boat_name?: string;
    customer?: {
        name?: string | null;
    };
}

export type DifferenceFilterColumn =
    | 'id'
    | 'invoice_date'
    | 'customer'
    | 'boat'
    | 'total_diff_amount';

export interface DifferenceColumnFilter {
    values?: string[];
    min?: string;
    max?: string;
}

export interface DifferenceFilters {
    search: string;
    columns: Partial<Record<DifferenceFilterColumn, DifferenceColumnFilter>>;
}

const initialFilters: DifferenceFilters = { search: '', columns: {} };

function getDateValue(value?: string) {
    return value?.slice(0, 10) ?? '';
}

function formatAmount(value: number) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
    }).format(value);
}

function matchesRange(value: number, min?: string, max?: string) {
    const minimum = min ? Number(min) : undefined;
    const maximum = max ? Number(max) : undefined;

    return (
        (minimum === undefined || value >= minimum) &&
        (maximum === undefined || value <= maximum)
    );
}

export function useDifferenceFilters(reports: DifferenceReport[]) {
    const [filters, setFilters] = useState<DifferenceFilters>(initialFilters);

    const filteredReports = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return reports.filter((report) => {
            const date = getDateValue(report.invoice_date);
            const customer = report.customer?.name || '---';
            const boat = report.boat_name || '---';
            const amount = Number(report.total_diff_amount);
            const matchesSearch =
                !query ||
                [
                    report.id,
                    `#${report.id}`,
                    date,
                    formatDateDisplay(date),
                    customer,
                    boat,
                    amount,
                    formatAmount(amount),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    DifferenceFilterColumn,
                    DifferenceColumnFilter,
                ][]
            ).every(([column, filter]) => {
                if (column === 'customer' && filter.values?.length) {
                    return filter.values.includes(customer);
                }

                if (column === 'boat' && filter.values?.length) {
                    return filter.values.includes(boat);
                }

                if (column === 'invoice_date' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || date >= filter.min) &&
                        (!filter.max || date <= filter.max)
                    );
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return matchesRange(report.id, filter.min, filter.max);
                }

                if (
                    column === 'total_diff_amount' &&
                    (filter.min || filter.max)
                ) {
                    return matchesRange(amount, filter.min, filter.max);
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [reports, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredReports,
        activeFilterCount,
    };
}
