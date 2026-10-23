import { useMemo, useState } from 'react';
import { InvoiceItem } from '@/types/invoice-item';

export type InvoiceItemFilterColumn =
    | 'boat'
    | 'category'
    | 'quantity'
    | 'price'
    | 'unit'
    | 'weight'
    | 'boxes'
    | 'amount'
    | 'difference'
    | 'sale';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface InvoiceItemFilters {
    search: string;
    columns: Partial<Record<InvoiceItemFilterColumn, ColumnFilterValue>>;
}

const initialFilters: InvoiceItemFilters = { search: '', columns: {} };

const getColumnValue = (
    item: InvoiceItem,
    column: InvoiceItemFilterColumn,
): string | number => {
    switch (column) {
        case 'boat':
            return item.boat?.name ?? '';
        case 'category':
            return item.category?.name ?? '';
        case 'quantity':
            return item.unit_count;
        case 'price':
            return item.unit_price;
        case 'unit':
            return item.unit;
        case 'weight':
            return item.weight;
        case 'boxes':
            return item.box;
        case 'amount':
            return item.amount;
        case 'difference':
            return (item.differences?.length ?? 0) > 0
                ? 'Avec différence'
                : 'Sans différence';
        case 'sale':
            return (item.sale_items?.length ?? 0) > 0
                ? 'Avec vente'
                : 'Sans vente';
    }
};

export function useInvoiceItemFilters(items: InvoiceItem[]) {
    const [filters, setFilters] = useState<InvoiceItemFilters>(initialFilters);

    const filteredItems = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return items.filter((item) => {
            const matchesSearch =
                !query ||
                [
                    item.boat?.name,
                    item.category?.name,
                    item.unit,
                    item.unit_count,
                    item.unit_price,
                    item.weight,
                    item.box,
                    item.amount,
                    (item.differences?.length ?? 0) > 0
                        ? 'avec différence'
                        : 'sans différence',
                    (item.sale_items?.length ?? 0) > 0
                        ? 'avec vente'
                        : 'sans vente',
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    InvoiceItemFilterColumn,
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
