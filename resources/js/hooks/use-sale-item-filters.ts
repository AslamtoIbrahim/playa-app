import { useMemo, useState } from 'react';
import type { SaleItem } from '@/types/sale-item';

export type SaleItemFilterColumn =
    | 'boat'
    | 'item'
    | 'quantity'
    | 'sale_price'
    | 'real_price'
    | 'amount'
    | 'tax'
    | 'total_diff';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface SaleItemFilters {
    search: string;
    columns: Partial<Record<SaleItemFilterColumn, ColumnFilterValue>>;
}

const initialFilters: SaleItemFilters = { search: '', columns: {} };

const getColumnValue = (
    item: SaleItem,
    column: SaleItemFilterColumn,
): string | number => {
    switch (column) {
        case 'boat':
            return item.boat?.name ?? item.invoice_item?.boat?.name ?? '—';
        case 'item':
            return item.item?.name ?? item.invoice_item?.category?.name ?? '';
        case 'quantity':
            return Math.abs(Number(item.unit_count) || 0);
        case 'sale_price':
            return Number(item.sale_price) || 0;
        case 'real_price':
            return Number(item.real_price) || 0;
        case 'amount':
            return Math.abs(Number(item.amount) || 0);
        case 'tax':
            return Math.abs(Number(item.tax) || 0);
        case 'total_diff':
            return Number(item.total_diff) || 0;
    }
};

export function useSaleItemFilters(items: SaleItem[]) {
    const [filters, setFilters] = useState<SaleItemFilters>(initialFilters);

    const filteredItems = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return items.filter((item) => {
            const matchesSearch =
                !query ||
                [
                    getColumnValue(item, 'boat'),
                    getColumnValue(item, 'item'),
                    getColumnValue(item, 'quantity'),
                    getColumnValue(item, 'sale_price'),
                    getColumnValue(item, 'real_price'),
                    getColumnValue(item, 'amount'),
                    getColumnValue(item, 'tax'),
                    getColumnValue(item, 'total_diff'),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    SaleItemFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                const value = getColumnValue(item, column);

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
    }, [items, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredItems,
        activeFilterCount,
        clearFilters: () => setFilters(initialFilters),
        clearColumnFilters: () =>
            setFilters((current) => ({ ...current, columns: {} })),
    };
}
