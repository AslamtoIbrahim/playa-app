import { useMemo, useState } from 'react';

import { formatDateDisplay } from '@/lib/date';
import type { Attendance } from '@/types/attendance';

export type AttendanceFilterColumn =
    | 'id'
    | 'date'
    | 'session_date'
    | 'zone'
    | 'total_wage';

export interface AttendanceColumnFilter {
    values?: string[];
    min?: string;
    max?: string;
}

export interface AttendanceFilters {
    search: string;
    columns: Partial<Record<AttendanceFilterColumn, AttendanceColumnFilter>>;
}

const initialFilters: AttendanceFilters = { search: '', columns: {} };

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
});

function getDateValue(value?: string) {
    return value?.slice(0, 10) ?? '';
}

function formatCurrency(value: number) {
    return currencyFormatter.format(value);
}

function matchesRange(value: number, min?: string, max?: string) {
    const minimum = min ? Number(min) : undefined;
    const maximum = max ? Number(max) : undefined;

    return (
        (minimum === undefined || value >= minimum) &&
        (maximum === undefined || value <= maximum)
    );
}

function getAttendanceColumnValue(
    attendance: Attendance,
    column: AttendanceFilterColumn,
): string | number {
    switch (column) {
        case 'id':
            return attendance.id;
        case 'date':
            return getDateValue(attendance.date);
        case 'session_date':
            return getDateValue(
                attendance.session_zone?.daily_session?.session_date,
            );
        case 'zone':
            return attendance.session_zone?.zone?.name || '-';
        case 'total_wage':
            return Number(attendance.total_wage);
    }
}

export function useAttendanceFilters(attendances: Attendance[]) {
    const [filters, setFilters] = useState<AttendanceFilters>(initialFilters);

    const filteredAttendances = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return attendances.filter((attendance) => {
            const date = getDateValue(attendance.date);
            const sessionDate = getDateValue(
                attendance.session_zone?.daily_session?.session_date,
            );
            const zone = attendance.session_zone?.zone?.name || '-';
            const wage = Number(attendance.total_wage);
            const matchesSearch =
                !query ||
                [
                    attendance.id,
                    `#${attendance.id}`,
                    date,
                    date ? formatDateDisplay(date) : '---',
                    sessionDate,
                    sessionDate ? formatDateDisplay(sessionDate) : '-',
                    zone,
                    wage,
                    wage.toLocaleString('fr-FR'),
                    formatCurrency(wage),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    AttendanceFilterColumn,
                    AttendanceColumnFilter,
                ][]
            ).every(([column, filter]) => {
                const value = getAttendanceColumnValue(attendance, column);

                if (column === 'zone' && filter.values?.length) {
                    return filter.values.includes(String(value));
                }

                if (
                    (column === 'date' || column === 'session_date') &&
                    (filter.min || filter.max)
                ) {
                    const date = String(value);

                    return (
                        Boolean(date) &&
                        (!filter.min || date >= filter.min) &&
                        (!filter.max || date <= filter.max)
                    );
                }

                if (
                    (column === 'id' || column === 'total_wage') &&
                    (filter.min || filter.max)
                ) {
                    return matchesRange(Number(value), filter.min, filter.max);
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [attendances, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredAttendances,
        activeFilterCount,
    };
}

export function getAttendanceFilterOptions(
    attendances: Attendance[],
    column: 'zone',
) {
    return [
        ...new Set(
            attendances.map((attendance) =>
                String(getAttendanceColumnValue(attendance, column)),
            ),
        ),
    ].sort((left, right) => left.localeCompare(right, 'fr'));
}

export { formatCurrency as formatAttendanceCurrency };
