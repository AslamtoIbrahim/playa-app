import { formatDateDisplay } from '@/lib/date';
import type { Boat } from '@/types/boat';
import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type BoatFilterColumn = 'id' | 'name' | 'owner' | 'created_at';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface BoatFilters {
    search: string;
    columns: Partial<Record<BoatFilterColumn, ColumnFilterValue>>;
}

const initialFilters: BoatFilters = { search: '', columns: {} };

function getDateValue(value: string) {
    return value.slice(0, 10);
}

function getOwnerTypeLabel(boat: Boat) {
    if (!boat.owner_type) {
        return 'Non assigné';
    }

    return boat.owner_type.includes('Company') ? 'Société' : 'Client';
}

export function getBoatOwnerLabel(boat: Boat) {
    return boat.owner?.name || 'Non assigné';
}

export function useBoatFilters(boats: Boat[]) {
    const [filters, setFiltersState] = useState<BoatFilters>(initialFilters);
    const [page, setPage] = useState(1);

    const setFilters: Dispatch<SetStateAction<BoatFilters>> = useCallback(
        (nextFilters) => {
            setFiltersState(nextFilters);
            setPage(1);
        },
        [],
    );

    const filteredBoats = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return boats.filter((boat) => {
            const createdAt = getDateValue(boat.created_at);
            const ownerName = getBoatOwnerLabel(boat);
            const matchesSearch =
                !query ||
                [
                    boat.id,
                    boat.name,
                    ownerName,
                    getOwnerTypeLabel(boat),
                    boat.owner_id,
                    boat.owner_type,
                    createdAt,
                    formatDateDisplay(boat.created_at),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    BoatFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (
                    (column === 'name' || column === 'owner') &&
                    filter.values?.length
                ) {
                    const value =
                        column === 'name' ? boat.name : getBoatOwnerLabel(boat);

                    return filter.values.includes(value);
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || boat.id >= Number(filter.min)) &&
                        (!filter.max || boat.id <= Number(filter.max))
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
    }, [boats, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;
    const pageCount = Math.max(1, Math.ceil(filteredBoats.length / 10));
    const currentPage = Math.min(page, pageCount);
    const paginatedBoats = filteredBoats.slice(
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
        filteredBoats,
        paginatedBoats,
        activeFilterCount,
        currentPage,
        pageCount,
        setPage,
        clearFilters,
    };
}
