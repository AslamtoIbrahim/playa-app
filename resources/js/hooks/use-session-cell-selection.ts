import type { DailySession } from '@/types/daily-session';
import { useCallback, useMemo, useState } from 'react';

export type SessionSelectionField =
    | 'id'
    | 'session_date'
    | 'status'
    | 'total_buy'
    | 'total_sell'
    | 'margin';

export interface SessionSelectionStatisticsData {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

interface SessionCellSelection {
    rowId: number;
    field: SessionSelectionField;
    anchorId: number;
}

const numericFields = new Set<SessionSelectionField>([
    'total_buy',
    'total_sell',
    'margin',
]);

const parseNumber = (value: string): number | null => {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
};

const getCellValue = (
    session: DailySession,
    field: SessionSelectionField,
): string => {
    switch (field) {
        case 'id':
            return String(session.id);
        case 'session_date':
            return session.session_date;
        case 'status':
            return session.status;
        case 'total_buy':
            return String(session.total_buy);
        case 'total_sell':
            return String(session.total_sell);
        case 'margin':
            return String(session.total_sell - session.total_buy);
    }
};

export function useSessionCellSelection(sessions: DailySession[]) {
    const [selection, setSelection] = useState<SessionCellSelection | null>(
        null,
    );
    const rowIds = useMemo(
        () => sessions.map((session) => session.id),
        [sessions],
    );
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;

    const selectCell = useCallback(
        (rowId: number, field: SessionSelectionField, extend: boolean) => {
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
        (rowId: number, field: SessionSelectionField) => {
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

    const statistics = useMemo((): SessionSelectionStatisticsData | null => {
        if (!activeSelection) {
            return null;
        }

        const start = rowIds.indexOf(activeSelection.anchorId);
        const end = rowIds.indexOf(activeSelection.rowId);
        const selectedSessions = sessions.slice(
            Math.min(start, end),
            Math.max(start, end) + 1,
        );
        const values = selectedSessions.map((session) =>
            getCellValue(session, activeSelection.field),
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
    }, [activeSelection, rowIds, sessions]);

    return {
        selection: activeSelection,
        setSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics,
    };
}
