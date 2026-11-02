import { formatDateDisplay } from '@/lib/date';
import type { Category } from '@/types/category';
import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type CategoryFilterColumn = 'id' | 'name' | 'created_at';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface CategoryFilters {
    search: string;
    columns: Partial<Record<CategoryFilterColumn, ColumnFilterValue>>;
}

const initialFilters: CategoryFilters = { search: '', columns: {} };

function getDateValue(value?: string) {
    return value?.slice(0, 10) ?? '';
}

export function useCategoryFilters(categories: Category[]) {
    const [filters, setFiltersState] =
        useState<CategoryFilters>(initialFilters);
    const [page, setPage] = useState(1);

    const setFilters: Dispatch<SetStateAction<CategoryFilters>> = useCallback(
        (nextFilters) => {
            setFiltersState(nextFilters);
            setPage(1);
        },
        [],
    );

    const filteredCategories = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return categories.filter((category) => {
            const createdAt = getDateValue(category.created_at);
            const updatedAt = getDateValue(category.updated_at);
            const matchesSearch =
                !query ||
                [
                    category.id,
                    category.name,
                    createdAt,
                    updatedAt,
                    category.created_at
                        ? formatDateDisplay(category.created_at)
                        : '',
                    category.updated_at
                        ? formatDateDisplay(category.updated_at)
                        : '',
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    CategoryFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (column === 'name' && filter.values?.length) {
                    return filter.values.includes(category.name);
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || category.id >= Number(filter.min)) &&
                        (!filter.max || category.id <= Number(filter.max))
                    );
                }

                if (column === 'created_at' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || createdAt >= filter.min) &&
                        (!filter.max || createdAt <= filter.max)
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [categories, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;
    const pageCount = Math.max(1, Math.ceil(filteredCategories.length / 10));
    const currentPage = Math.min(page, pageCount);
    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * 10,
        currentPage * 10,
    );

    const clearFilters = useCallback(() => {
        setFiltersState(initialFilters);
        setPage(1);
    }, []);

    return {
        filters,
        setFilters,
        filteredCategories,
        paginatedCategories,
        activeFilterCount,
        currentPage,
        pageCount,
        setPage,
        clearFilters,
    };
}
