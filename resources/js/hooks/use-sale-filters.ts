import { format } from 'date-fns';
import { useMemo, useState } from 'react';

import type { Sale } from '@/types/sale';

export type SaleFilterColumn =
    | 'id'
    | 'date'
    | 'customer'
    | 'session'
    | 'type'
    | 'boxes'
    | 'weight'
    | 'amount';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface SaleFilters {
    search: string;
    columns: Partial<Record<SaleFilterColumn, ColumnFilterValue>>;
}

const initialFilters: SaleFilters = { search: '', columns: {} };

function getColumnValue(sale: Sale, column: SaleFilterColumn): string | number {
    switch (column) {
        case 'id':
            return sale.id;
        case 'date':
            return sale.date.slice(0, 10);
        case 'customer':
            return sale.owner?.name ?? 'Client Divers';
        case 'session':
            return sale.session?.session_date.slice(0, 10) ?? '';
        case 'type':
            return sale.type;
        case 'boxes':
            return Number(sale.boxes) || 0;
        case 'weight':
            return Number(sale.weight) || 0;
        case 'amount':
            return Number(sale.amount) || 0;
    }
}

function getSearchValues(sale: Sale): (string | number | undefined)[] {
    const amount = Number(sale.amount) || 0;
    const sessionDate = sale.session?.session_date;

    return [
        sale.id,
        sale.date,
        format(new Date(sale.date), 'dd/MM/yyyy'),
        sale.owner?.name ?? 'Client Divers',
        sale.owner_id,
        sale.session_id,
        sessionDate,
        sessionDate ? format(new Date(sessionDate), 'dd/MM/yy') : '',
        sale.session?.status,
        sale.session ? '' : '—',
        sale.type,
        sale.boxes,
        sale.weight,
        amount,
        amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
        sale.created_by,
        sale.created_at,
        sale.updated_at,
    ];
}

export function useSaleFilters(sales: Sale[]) {
    const [filters, setFilters] = useState<SaleFilters>(initialFilters);

    const filteredSales = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return sales.filter((sale) => {
            const matchesSearch =
                !query ||
                getSearchValues(sale).some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    SaleFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                const value = getColumnValue(sale, column);

                if (column === 'date' || column === 'session') {
                    const dateValue = String(value);

                    if (!dateValue && (filter.min || filter.max)) {
                        return false;
                    }

                    return (
                        (!filter.min || dateValue >= filter.min) &&
                        (!filter.max || dateValue <= filter.max)
                    );
                }

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
    }, [sales, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredSales,
        activeFilterCount,
        clearColumnFilters: () =>
            setFilters((current) => ({ ...current, columns: {} })),
    };
}
