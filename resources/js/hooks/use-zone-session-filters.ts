import { formatDateDisplay } from '@/lib/date';
import { useMemo, useState } from 'react';

export interface ZoneDailySession {
    id: number | null;
    session_date: string | null;
    status: string | null;
    total_buy: number;
    total_sell: number;
    closed_at: string | null;
}

export type ZoneSessionFilterColumn =
    | 'session_date'
    | 'status'
    | 'total_buy'
    | 'total_sell'
    | 'margin';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface ZoneSessionFilters {
    search: string;
    columns: Partial<Record<ZoneSessionFilterColumn, ColumnFilterValue>>;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'MAD',
    }).format(value);

export function useZoneSessionFilters(sessions: ZoneDailySession[]) {
    const [filters, setFilters] = useState<ZoneSessionFilters>({
        search: '',
        columns: {},
    });

    const filteredSessions = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return sessions.filter((session) => {
            const margin = session.total_sell - session.total_buy;
            const dateValue = session.session_date?.slice(0, 10) ?? '';
            const statusValue = session.status === 'open' ? 'open' : 'closed';
            const statusLabel = statusValue === 'open' ? 'Ouverte' : 'Clôturée';
            const matchesSearch =
                !query ||
                [
                    session.id,
                    session.session_date,
                    dateValue,
                    formatDateDisplay(session.session_date),
                    session.status,
                    statusLabel,
                    session.total_buy,
                    formatCurrency(session.total_buy),
                    session.total_sell,
                    formatCurrency(session.total_sell),
                    margin,
                    formatCurrency(margin),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    ZoneSessionFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (column === 'status' && filter.values?.length) {
                    return filter.values.includes(statusValue);
                }

                if (column === 'session_date' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || dateValue >= filter.min) &&
                        (!filter.max || dateValue <= filter.max)
                    );
                }

                const numericValue =
                    column === 'total_buy'
                        ? session.total_buy
                        : column === 'total_sell'
                          ? session.total_sell
                          : column === 'margin'
                            ? margin
                            : null;

                if (
                    numericValue !== null &&
                    ((filter.min !== undefined && filter.min !== '') ||
                        (filter.max !== undefined && filter.max !== ''))
                ) {
                    return (
                        (filter.min === undefined ||
                            filter.min === '' ||
                            numericValue >= Number(filter.min)) &&
                        (filter.max === undefined ||
                            filter.max === '' ||
                            numericValue <= Number(filter.max))
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [sessions, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(
            filter?.values?.length ||
            (filter?.min !== undefined && filter.min !== '') ||
            (filter?.max !== undefined && filter.max !== ''),
        ),
    ).length;

    return {
        filters,
        setFilters,
        filteredSessions,
        activeFilterCount,
        clearColumnFilters: () =>
            setFilters((current) => ({ ...current, columns: {} })),
    };
}
