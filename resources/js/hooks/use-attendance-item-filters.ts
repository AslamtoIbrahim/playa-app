import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { AttendanceItem } from '@/types/attendance-item';

export type AttendanceItemFilterColumn = 'worker' | 'wage' | 'status';

interface AttendanceItemColumnFilter {
    values?: string[];
    min?: string;
    max?: string;
}

export interface AttendanceItemFilters {
    search: string;
    columns: Partial<
        Record<AttendanceItemFilterColumn, AttendanceItemColumnFilter>
    >;
}

const initialFilters: AttendanceItemFilters = { search: '', columns: {} };
const PAGE_SIZE = 10;

function getStatus(item: AttendanceItem) {
    return item.is_present ? 'Présent' : 'Absent';
}

function getColumnValue(
    item: AttendanceItem,
    column: AttendanceItemFilterColumn,
): string | number {
    switch (column) {
        case 'worker':
            return item.worker?.name ?? '';
        case 'wage':
            return Number(item.wage);
        case 'status':
            return getStatus(item);
    }
}

export function useAttendanceItemFilters(items: AttendanceItem[]) {
    const [filters, setCurrentFilters] =
        useState<AttendanceItemFilters>(initialFilters);
    const [page, setPage] = useState(1);
    const setFilters: Dispatch<SetStateAction<AttendanceItemFilters>> = (
        nextFilters,
    ) => {
        setCurrentFilters(nextFilters);
        setPage(1);
    };

    const filteredItems = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return items.filter((item) => {
            const wage = Number(item.wage);
            const matchesSearch =
                !query ||
                [
                    item.worker?.name,
                    wage,
                    wage.toLocaleString('fr-FR'),
                    getStatus(item),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    AttendanceItemFilterColumn,
                    AttendanceItemColumnFilter,
                ][]
            ).every(([column, filter]) => {
                const value = getColumnValue(item, column);

                if (filter.values?.length) {
                    return filter.values.includes(String(value));
                }

                if (column === 'wage' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || wage >= Number(filter.min)) &&
                        (!filter.max || wage <= Number(filter.max))
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [filters, items]);

    const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageItems = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;

        return filteredItems.slice(start, start + PAGE_SIZE);
    }, [currentPage, filteredItems]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredItems,
        pageItems,
        page: currentPage,
        setPage,
        pageCount,
        pageSize: PAGE_SIZE,
        activeFilterCount,
        clearFilters: () => setFilters(initialFilters),
    };
}

export function getAttendanceItemFilterOptions(
    items: AttendanceItem[],
    column: 'worker' | 'status',
) {
    return [
        ...new Set(
            items
                .map((item) => String(getColumnValue(item, column)))
                .filter(Boolean),
        ),
    ].sort((left, right) => left.localeCompare(right, 'fr'));
}
