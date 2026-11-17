import type { Attendance } from '@/types/attendance';
import { useCallback, useMemo, useState } from 'react';

export type AttendanceSelectionField =
    | 'id'
    | 'date'
    | 'session_date'
    | 'zone'
    | 'total_wage';

export interface AttendanceSelectionStatisticsData {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

interface AttendanceCellSelection {
    rowId: number;
    field: AttendanceSelectionField;
    anchorId: number;
}

const numericFields = new Set<AttendanceSelectionField>(['total_wage']);

const parseNumber = (value: string): number | null => {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
};

const getCellValue = (
    attendance: Attendance,
    field: AttendanceSelectionField,
): string => {
    switch (field) {
        case 'id':
            return String(attendance.id);
        case 'date':
            return attendance.date;
        case 'session_date':
            return attendance.session_zone?.daily_session?.session_date ?? '';
        case 'zone':
            return attendance.session_zone?.zone?.name ?? '';
        case 'total_wage':
            return String(attendance.total_wage);
    }
};

export function useAttendanceCellSelection(attendances: Attendance[]) {
    const [selection, setSelection] = useState<AttendanceCellSelection | null>(
        null,
    );
    const rowIds = useMemo(
        () => attendances.map((attendance) => attendance.id),
        [attendances],
    );
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;

    const selectCell = useCallback(
        (rowId: number, field: AttendanceSelectionField, extend: boolean) => {
            setSelection((current) => ({
                rowId,
                field,
                anchorId:
                    extend &&
                    current?.field === field &&
                    rowIds.includes(current.anchorId)
                        ? current.anchorId
                        : rowId,
            }));
        },
        [rowIds],
    );

    const extendSelection = useCallback(
        (rowId: number, field: AttendanceSelectionField) => {
            setSelection((current) => ({
                rowId,
                field,
                anchorId:
                    current?.field === field &&
                    rowIds.includes(current.anchorId) &&
                    rowIds.includes(current.rowId)
                        ? current.anchorId
                        : (current?.rowId ?? rowId),
            }));
        },
        [rowIds],
    );

    const getSelectedCellRange = useCallback(
        (rowId: number): string | null => {
            if (!activeSelection) {
                return null;
            }

            const index = rowIds.indexOf(rowId);
            const anchor = rowIds.indexOf(activeSelection.anchorId);
            const target = rowIds.indexOf(activeSelection.rowId);

            if (
                index < 0 ||
                anchor < 0 ||
                target < 0 ||
                index < Math.min(anchor, target) ||
                index > Math.max(anchor, target)
            ) {
                return null;
            }

            return `|${rowIds
                .slice(Math.min(anchor, target), Math.max(anchor, target) + 1)
                .map((id) => `${id}:${activeSelection.field}`)
                .join('|')}|`;
        },
        [activeSelection, rowIds],
    );

    const statistics = useMemo((): AttendanceSelectionStatisticsData | null => {
        if (!activeSelection) {
            return null;
        }

        const start = rowIds.indexOf(activeSelection.anchorId);
        const end = rowIds.indexOf(activeSelection.rowId);
        const selectedAttendances = attendances.slice(
            Math.min(start, end),
            Math.max(start, end) + 1,
        );
        const values = selectedAttendances.map((attendance) =>
            getCellValue(attendance, activeSelection.field),
        );
        const numbers = values
            .map(parseNumber)
            .filter((value): value is number => value !== null);
        const numeric = numericFields.has(activeSelection.field);
        const count = numeric
            ? numbers.length
            : values.filter((value) => value.trim() !== '').length;
        const sum = numbers.reduce((total, value) => total + value, 0);

        return {
            primary: numeric ? sum : count,
            numeric,
            sum,
            average: numbers.length ? sum / numbers.length : null,
            minimum: numbers.length ? Math.min(...numbers) : null,
            maximum: numbers.length ? Math.max(...numbers) : null,
            count,
        };
    }, [activeSelection, attendances, rowIds]);

    return {
        setSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics,
    };
}
