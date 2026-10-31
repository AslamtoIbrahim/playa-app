import { formatDateDisplay } from '@/lib/date';
import type { Receipt } from '@/types/receipt';
import { useMemo, useState } from 'react';

export type ReceiptFilterColumn =
    | 'id'
    | 'date'
    | 'customer'
    | 'session_date'
    | 'zone'
    | 'total_amount'
    | 'total_boxes';

export interface ReceiptColumnFilter {
    values?: string[];
    min?: string;
    max?: string;
}

export interface ReceiptFilters {
    search: string;
    columns: Partial<Record<ReceiptFilterColumn, ReceiptColumnFilter>>;
}

const initialFilters: ReceiptFilters = { search: '', columns: {} };

function getDateValue(value?: string) {
    return value?.slice(0, 10) ?? '';
}

function formatAmount(value: number) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
    }).format(Number(value));
}

function matchesRange(value: number, min?: string, max?: string) {
    return (
        (min === undefined || min === '' || value >= Number(min)) &&
        (max === undefined || max === '' || value <= Number(max))
    );
}

export function useReceiptFilters(receipts: Receipt[]) {
    const [filters, setFilters] = useState<ReceiptFilters>(initialFilters);

    const filteredReceipts = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return receipts.filter((receipt) => {
            const date = getDateValue(receipt.date);
            const sessionDate = getDateValue(
                receipt.session_zone?.daily_session?.session_date,
            );
            const customer = receipt.customer?.name || '---';
            const zone = receipt.session_zone?.zone?.name || '-';
            const totalAmount = Number(receipt.total_amount);
            const totalBoxes = Number(receipt.total_boxes || 0);

            const matchesSearch =
                !query ||
                [
                    receipt.id,
                    `#${receipt.id}`,
                    date,
                    formatDateDisplay(receipt.date),
                    customer,
                    sessionDate,
                    sessionDate ? formatDateDisplay(sessionDate) : '-',
                    zone,
                    totalAmount,
                    formatAmount(totalAmount),
                    totalBoxes,
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    ReceiptFilterColumn,
                    ReceiptColumnFilter,
                ][]
            ).every(([column, filter]) => {
                if (column === 'customer' && filter.values?.length) {
                    return filter.values.includes(customer);
                }

                if (column === 'zone' && filter.values?.length) {
                    return filter.values.includes(zone);
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return matchesRange(receipt.id, filter.min, filter.max);
                }

                if (column === 'total_amount' && (filter.min || filter.max)) {
                    return matchesRange(totalAmount, filter.min, filter.max);
                }

                if (column === 'total_boxes' && (filter.min || filter.max)) {
                    return matchesRange(totalBoxes, filter.min, filter.max);
                }

                if (column === 'date' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || date >= filter.min) &&
                        (!filter.max || date <= filter.max)
                    );
                }

                if (column === 'session_date' && (filter.min || filter.max)) {
                    return Boolean(
                        sessionDate &&
                        (!filter.min || sessionDate >= filter.min) &&
                        (!filter.max || sessionDate <= filter.max),
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [receipts, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredReceipts,
        activeFilterCount,
        clearColumnFilters: () =>
            setFilters((current) => ({ ...current, columns: {} })),
    };
}
