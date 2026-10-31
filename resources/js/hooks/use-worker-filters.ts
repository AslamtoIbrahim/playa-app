import { formatDateDisplay } from '@/lib/date';
import type { Worker } from '@/types/worker';
import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type WorkerFilterColumn =
    | 'id'
    | 'name'
    | 'attendances_count'
    | 'created_at';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface WorkerFilters {
    search: string;
    columns: Partial<Record<WorkerFilterColumn, ColumnFilterValue>>;
}

const initialFilters: WorkerFilters = { search: '', columns: {} };

function getDateValue(value: string) {
    return value.slice(0, 10);
}

export function useWorkerFilters(workers: Worker[]) {
    const [filters, setFiltersState] = useState<WorkerFilters>(initialFilters);
    const [page, setPage] = useState(1);

    const setFilters: Dispatch<SetStateAction<WorkerFilters>> = useCallback(
        (nextFilters) => {
            setFiltersState(nextFilters);
            setPage(1);
        },
        [],
    );

    const filteredWorkers = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return workers.filter((worker) => {
            const attendanceCount = worker.attendances_count ?? 0;
            const createdAt = getDateValue(worker.created_at);
            const updatedAt = getDateValue(worker.updated_at);
            const matchesSearch =
                !query ||
                [
                    worker.id,
                    worker.name,
                    attendanceCount,
                    createdAt,
                    updatedAt,
                    formatDateDisplay(worker.created_at),
                    formatDateDisplay(worker.updated_at),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    WorkerFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (column === 'name' && filter.values?.length) {
                    return filter.values.includes(worker.name);
                }

                if (
                    (column === 'id' || column === 'attendances_count') &&
                    (filter.min || filter.max)
                ) {
                    const value = column === 'id' ? worker.id : attendanceCount;

                    return (
                        (!filter.min || value >= Number(filter.min)) &&
                        (!filter.max || value <= Number(filter.max))
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
    }, [workers, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;
    const pageCount = Math.max(1, Math.ceil(filteredWorkers.length / 10));
    const currentPage = Math.min(page, pageCount);
    const paginatedWorkers = filteredWorkers.slice(
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
        filteredWorkers,
        paginatedWorkers,
        activeFilterCount,
        currentPage,
        pageCount,
        setPage,
        clearFilters,
    };
}
