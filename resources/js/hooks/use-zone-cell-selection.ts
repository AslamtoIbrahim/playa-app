import { useCallback, useMemo, useState } from 'react';
import type { ZoneDailySession } from '@/hooks/use-zone-session-filters';

export type ZoneSelectionField = 'total_buy' | 'total_sell' | 'margin';

export interface ZoneSelectionStatisticsData {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

interface ZoneCellSelection {
    rowId: string;
    field: ZoneSelectionField;
    anchorId: string;
}

export function getZoneSessionRowId(session: ZoneDailySession, index: number) {
    return session.id !== null
        ? `id:${session.id}`
        : `date:${session.session_date ?? index}`;
}

export function useZoneCellSelection(sessions: ZoneDailySession[]) {
    const [selection, setSelection] = useState<ZoneCellSelection | null>(null);
    const rowIds = useMemo(() => sessions.map(getZoneSessionRowId), [sessions]);
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;

    const selectCell = useCallback(
        (rowId: string, field: ZoneSelectionField, extend: boolean) => {
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
        (rowId: string, field: ZoneSelectionField) => {
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
        (rowId: string): string | null => {
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

    const statistics = useMemo((): ZoneSelectionStatisticsData | null => {
        if (!activeSelection) {
            return null;
        }

        const start = rowIds.indexOf(activeSelection.anchorId);
        const end = rowIds.indexOf(activeSelection.rowId);

        if (start < 0 || end < 0) {
            return null;
        }

        const selectedSessions = sessions.slice(
            Math.min(start, end),
            Math.max(start, end) + 1,
        );
        const values = selectedSessions.map((session) =>
            activeSelection.field === 'total_buy'
                ? Number(session.total_buy || 0)
                : activeSelection.field === 'total_sell'
                  ? Number(session.total_sell || 0)
                  : Number(session.total_sell || 0) -
                    Number(session.total_buy || 0),
        );
        const sum = values.reduce((total, value) => total + value, 0);

        return {
            primary: sum,
            numeric: true,
            sum,
            average: values.length ? sum / values.length : null,
            minimum: values.length ? Math.min(...values) : null,
            maximum: values.length ? Math.max(...values) : null,
            count: values.length,
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
