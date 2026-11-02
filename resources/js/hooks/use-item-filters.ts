import { formatDateDisplay } from '@/lib/date';
import type { Item } from '@/types/item';
import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type ItemFilterColumn = 'id' | 'name' | 'category' | 'created_at';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface ItemFilters {
    search: string;
    columns: Partial<Record<ItemFilterColumn, ColumnFilterValue>>;
}

const initialFilters: ItemFilters = { search: '', columns: {} };

function getDateValue(value?: string) {
    return value?.slice(0, 10) ?? '';
}

export function useItemFilters(items: Item[]) {
    const [filters, setFiltersState] = useState<ItemFilters>(initialFilters);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const setFilters: Dispatch<SetStateAction<ItemFilters>> = useCallback(
        (nextFilters) => {
            setFiltersState(nextFilters);
            setPage(1);
        },
        [],
    );

    const filteredItems = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return items.filter((item) => {
            const createdAt = getDateValue(item.created_at);
            const categoryName = item.category?.name || 'Sans catégorie';
            const matchesSearch =
                !query ||
                [
                    item.id,
                    `#${item.id}`,
                    item.name,
                    categoryName,
                    createdAt,
                    item.created_at,
                    formatDateDisplay(item.created_at),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    ItemFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (
                    (column === 'name' || column === 'category') &&
                    filter.values?.length
                ) {
                    const value = column === 'name' ? item.name : categoryName;

                    return filter.values.includes(value);
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || item.id >= Number(filter.min)) &&
                        (!filter.max || item.id <= Number(filter.max))
                    );
                }

                if (column === 'created_at' && (filter.min || filter.max)) {
                    return (
                        Boolean(createdAt) &&
                        (!filter.min || createdAt >= filter.min) &&
                        (!filter.max || createdAt <= filter.max)
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
    const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const clearFilters = useCallback(() => {
        setFiltersState(initialFilters);
        setPage(1);
    }, []);

    return {
        filters,
        setFilters,
        filteredItems,
        paginatedItems,
        activeFilterCount,
        currentPage,
        pageCount,
        setPage,
        clearFilters,
    };
}
