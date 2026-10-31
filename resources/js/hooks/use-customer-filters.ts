import { formatDateDisplay } from '@/lib/date';
import type { Customer } from '@/types/customer';
import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type CustomerFilterColumn = 'id' | 'name' | 'created_at';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface CustomerFilters {
    search: string;
    columns: Partial<Record<CustomerFilterColumn, ColumnFilterValue>>;
}

const initialFilters: CustomerFilters = { search: '', columns: {} };

function getDateValue(value: string) {
    return value.slice(0, 10);
}

export function useCustomerFilters(customers: Customer[]) {
    const [filters, setFiltersState] =
        useState<CustomerFilters>(initialFilters);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSizeState] = useState(10);

    const setFilters: Dispatch<SetStateAction<CustomerFilters>> = useCallback(
        (nextFilters) => {
            setFiltersState(nextFilters);
            setPage(1);
        },
        [],
    );

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPage(1);
    }, []);

    const filteredCustomers = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return customers.filter((customer) => {
            const createdAt = getDateValue(customer.created_at);
            const updatedAt = getDateValue(customer.updated_at);
            const matchesSearch =
                !query ||
                [
                    customer.id,
                    customer.name,
                    createdAt,
                    updatedAt,
                    formatDateDisplay(customer.created_at),
                    formatDateDisplay(customer.updated_at),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    CustomerFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (column === 'name' && filter.values?.length) {
                    return filter.values.includes(customer.name);
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || customer.id >= Number(filter.min)) &&
                        (!filter.max || customer.id <= Number(filter.max))
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
    }, [customers, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;
    const pageCount = Math.max(
        1,
        Math.ceil(filteredCustomers.length / pageSize),
    );
    const currentPage = Math.min(page, pageCount);
    const paginatedCustomers = filteredCustomers.slice(
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
        filteredCustomers,
        paginatedCustomers,
        activeFilterCount,
        currentPage,
        pageCount,
        pageSize,
        setPage,
        setPageSize,
        clearFilters,
    };
}
