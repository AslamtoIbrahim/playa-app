import type { DifferenceReport } from '@/hooks/use-difference-filters';
import { formatDateDisplay } from '@/lib/date';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

export type DifferenceSelectionField =
    | 'id'
    | 'invoice_date'
    | 'customer'
    | 'boat'
    | 'total_diff_amount';

export interface DifferenceSelectionStatisticsData {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

interface DifferenceCellSelection {
    anchorId: number;
    rowId: number;
    field: DifferenceSelectionField;
}

const getSelectionValue = (
    report: DifferenceReport,
    field: DifferenceSelectionField,
): string => {
    switch (field) {
        case 'id':
            return String(report.id);
        case 'invoice_date':
            return formatDateDisplay(report.invoice_date);
        case 'customer':
            return report.customer?.name || '---';
        case 'boat':
            return report.boat_name || '---';
        case 'total_diff_amount':
            return String(report.total_diff_amount);
    }
};

export function useDifferenceCellSelection(reports: DifferenceReport[]) {
    const [selection, setSelection] = useState<DifferenceCellSelection | null>(
        null,
    );
    const cellSelectDrag = useRef<{
        rowId: number;
        field: DifferenceSelectionField;
    } | null>(null);
    const suppressRowClick = useRef(false);
    const rowIds = useMemo(() => reports.map((report) => report.id), [reports]);
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;
    const statistics = useMemo((): DifferenceSelectionStatisticsData | null => {
        if (!activeSelection) {
            return null;
        }

        const anchorIndex = rowIds.indexOf(activeSelection.anchorId);
        const targetIndex = rowIds.indexOf(activeSelection.rowId);
        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);
        const values = reports
            .slice(start, end + 1)
            .map((report) => getSelectionValue(report, activeSelection.field));
        const numeric = activeSelection.field === 'total_diff_amount';
        const numbers = numeric
            ? values.map(Number).filter(Number.isFinite)
            : [];
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
    }, [activeSelection, reports, rowIds]);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const drag = cellSelectDrag.current;
            const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>(
                    '[data-difference-cell][data-difference-row]',
                );

            if (
                drag &&
                target?.dataset.differenceRow &&
                target.dataset.differenceCell === drag.field
            ) {
                const rowId = Number(target.dataset.differenceRow);

                if (rowId !== drag.rowId) {
                    suppressRowClick.current = true;
                    setSelection((current) => ({
                        anchorId:
                            current?.field === drag.field
                                ? current.anchorId
                                : drag.rowId,
                        rowId,
                        field: drag.field,
                    }));
                }
            }
        };

        const handlePointerUp = () => {
            cellSelectDrag.current = null;
        };

        const clearSelectionOutsideTable = (event: PointerEvent) => {
            const target = event.target;

            if (
                target instanceof Element &&
                !target.closest(
                    '[data-difference-cell], [data-difference-selection-statistics]',
                )
            ) {
                setSelection(null);
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        document.addEventListener('pointerdown', clearSelectionOutsideTable);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
            document.removeEventListener(
                'pointerdown',
                clearSelectionOutsideTable,
            );
        };
    }, []);

    const getSelectionCellProps = (
        rowId: number,
        field: DifferenceSelectionField,
    ) => {
        const rowIndex = rowIds.indexOf(rowId);
        const anchorIndex = activeSelection
            ? rowIds.indexOf(activeSelection.anchorId)
            : -1;
        const targetIndex = activeSelection
            ? rowIds.indexOf(activeSelection.rowId)
            : -1;
        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);
        const selected =
            activeSelection?.field === field &&
            rowIndex >= start &&
            rowIndex <= end;

        return {
            'data-difference-cell': field,
            'data-difference-row': rowId,
            onMouseDownCapture: (
                event: ReactMouseEvent<HTMLTableCellElement>,
            ) => {
                suppressRowClick.current = false;
                setSelection({
                    anchorId:
                        event.shiftKey && activeSelection?.field === field
                            ? activeSelection.anchorId
                            : rowId,
                    rowId,
                    field,
                });
                cellSelectDrag.current = event.shiftKey
                    ? null
                    : { rowId, field };
            },
            style: {
                cursor: 'cell',
                userSelect: 'none' as const,
                ...(selected
                    ? {
                          position: 'relative' as const,
                          backgroundColor: 'rgb(59 130 246 / 12%)',
                          boxShadow: [
                              'inset 1px 0 rgb(59 130 246)',
                              'inset -1px 0 rgb(59 130 246)',
                              rowIndex === start
                                  ? 'inset 0 1px rgb(59 130 246)'
                                  : '',
                              rowIndex === end
                                  ? 'inset 0 -1px rgb(59 130 246)'
                                  : '',
                          ]
                              .filter(Boolean)
                              .join(', '),
                      }
                    : {}),
            },
        };
    };

    const shouldIgnoreRowClick = (shiftKey: boolean) => {
        if (!shiftKey && !suppressRowClick.current) {
            return false;
        }

        suppressRowClick.current = false;

        return true;
    };

    return {
        statistics,
        getSelectionCellProps,
        shouldIgnoreRowClick,
    };
}
