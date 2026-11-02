import { formatDateDisplay } from '@/lib/date';
import type { Caution } from '@/types/caution';
import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type CautionFilterColumn = 'id' | 'name' | 'owner' | 'created_at';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface CautionFilters {
    search: string;
    columns: Partial<Record<CautionFilterColumn, ColumnFilterValue>>;
}

const initialFilters: CautionFilters = { search: '', columns: {} };

function getOwnerLabel(caution: Caution) {
    return caution.owner?.name || 'Inconnu';
}

function getOwnerTypeLabel(caution: Caution) {
    return caution.owner_type.includes('Company') ? 'Société' : 'Client';
}

export function useCautionFilters(cautions: Caution[]) {
    const [filters, setFiltersState] = useState<CautionFilters>(initialFilters);
    const [page, setPage] = useState(1);

    const setFilters: Dispatch<SetStateAction<CautionFilters>> = useCallback(
        (nextFilters) => {
            setFiltersState(nextFilters);
            setPage(1);
        },
        [],
    );

    const filteredCautions = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return cautions.filter((caution) => {
            const createdAt = caution.created_at.slice(0, 10);
            const ownerName = getOwnerLabel(caution);
            const ownerType = getOwnerTypeLabel(caution);
            const matchesSearch =
                !query ||
                [
                    caution.id,
                    `#${caution.id}`,
                    caution.name,
                    caution.owner_id,
                    caution.owner_type,
                    ownerName,
                    ownerType,
                    createdAt,
                    formatDateDisplay(caution.created_at),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    CautionFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (
                    (column === 'name' || column === 'owner') &&
                    filter.values?.length
                ) {
                    const value = column === 'name' ? caution.name : ownerName;

                    return filter.values.includes(value);
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || caution.id >= Number(filter.min)) &&
                        (!filter.max || caution.id <= Number(filter.max))
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
    }, [cautions, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;
    const pageCount = Math.max(1, Math.ceil(filteredCautions.length / 10));
    const currentPage = Math.min(page, pageCount);
    const paginatedCautions = filteredCautions.slice(
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
        filteredCautions,
        paginatedCautions,
        activeFilterCount,
        currentPage,
        pageCount,
        setPage,
        clearFilters,
    };
}
