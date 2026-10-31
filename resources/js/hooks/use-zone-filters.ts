import { formatDateDisplay } from '@/lib/date';
import type { Zone } from '@/types/zone';
import { useMemo, useState } from 'react';

export type ZoneFilterColumn = 'id' | 'name' | 'created_at';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface ZoneFilters {
    search: string;
    columns: Partial<Record<ZoneFilterColumn, ColumnFilterValue>>;
}

const initialFilters: ZoneFilters = { search: '', columns: {} };

function getDateValue(value: string) {
    return value.slice(0, 10);
}

export function useZoneFilters(zones: Zone[]) {
    const [filters, setFilters] = useState<ZoneFilters>(initialFilters);

    const filteredZones = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return zones.filter((zone) => {
            const dateValue = getDateValue(zone.created_at);
            const matchesSearch =
                !query ||
                [
                    zone.id,
                    zone.name,
                    dateValue,
                    formatDateDisplay(zone.created_at),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    ZoneFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (column === 'name' && filter.values?.length) {
                    return filter.values.includes(zone.name);
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || zone.id >= Number(filter.min)) &&
                        (!filter.max || zone.id <= Number(filter.max))
                    );
                }

                if (column === 'created_at' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || dateValue >= filter.min) &&
                        (!filter.max || dateValue <= filter.max)
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [zones, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredZones,
        activeFilterCount,
        clearColumnFilters: () =>
            setFilters((current) => ({ ...current, columns: {} })),
    };
}
