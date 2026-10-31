import { formatDateDisplay } from '@/lib/date';
import type { DailySession } from '@/types/daily-session';
import { useMemo, useState } from 'react';

export type SessionFilterColumn =
    | 'id'
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

export interface SessionFilters {
    search: string;
    columns: Partial<Record<SessionFilterColumn, ColumnFilterValue>>;
}

const initialFilters: SessionFilters = { search: '', columns: {} };

function getStatusLabel(status: DailySession['status']) {
    return status === 'open' ? 'Ouverte' : 'Clôturée';
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'MAD',
    }).format(value);
}

export function useSessionFilters(sessions: DailySession[]) {
    const [filters, setFilters] = useState<SessionFilters>(initialFilters);

    const filteredSessions = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return sessions.filter((session) => {
            const margin = session.total_sell - session.total_buy;
            const dateValue = session.session_date.slice(0, 10);
            const statusLabel = getStatusLabel(session.status);
            const matchesSearch =
                !query ||
                [
                    session.id,
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
                    SessionFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (column === 'status' && filter.values?.length) {
                    return filter.values.includes(session.status);
                }

                if (column === 'session_date' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || dateValue >= filter.min) &&
                        (!filter.max || dateValue <= filter.max)
                    );
                }

                const numericValue =
                    column === 'id'
                        ? session.id
                        : column === 'total_buy'
                          ? session.total_buy
                          : column === 'total_sell'
                            ? session.total_sell
                            : column === 'margin'
                              ? margin
                              : null;

                if (numericValue !== null && (filter.min || filter.max)) {
                    return (
                        (!filter.min || numericValue >= Number(filter.min)) &&
                        (!filter.max || numericValue <= Number(filter.max))
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [sessions, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
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
