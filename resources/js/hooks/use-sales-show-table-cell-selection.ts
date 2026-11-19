import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { SalesShowSelectionStatisticsData } from '@/hooks/use-sales-show-cell-selection';

interface RowWithId {
    id: number;
}

interface CellSelection<Field extends string> {
    anchorId: number;
    rowId: number;
    field: Field;
}

const parseNumber = (value: string): number | null => {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
};

export function useSalesShowTableCellSelection<
    Row extends RowWithId,
    Field extends string,
>(
    rows: Row[],
    table: string,
    getCellValue: (row: Row, field: Field) => string,
    numericFields: ReadonlySet<Field>,
) {
    const [selection, setSelection] = useState<CellSelection<Field> | null>(
        null,
    );
    const cellSelectDrag = useRef<{
        rowId: number;
        field: Field;
    } | null>(null);
    const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;

    const statistics = useMemo((): SalesShowSelectionStatisticsData | null => {
        if (!activeSelection) {
            return null;
        }

        const anchorIndex = rowIds.indexOf(activeSelection.anchorId);
        const targetIndex = rowIds.indexOf(activeSelection.rowId);
        const values = rows
            .slice(
                Math.min(anchorIndex, targetIndex),
                Math.max(anchorIndex, targetIndex) + 1,
            )
            .map((row) => getCellValue(row, activeSelection.field));
        const numeric = numericFields.has(activeSelection.field);
        const numbers = numeric
            ? values
                  .map(parseNumber)
                  .filter((value): value is number => value !== null)
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
    }, [activeSelection, getCellValue, numericFields, rowIds, rows]);

    const getSelectionCellProps = (rowId: number, field: Field) => {
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
            'data-sales-show-selection-table': table,
            'data-sales-show-selection-cell': field,
            'data-sales-show-selection-row': rowId,
            onMouseDownCapture: (
                event: ReactMouseEvent<HTMLTableCellElement>,
            ) => {
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

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const drag = cellSelectDrag.current;
            const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>(
                    '[data-sales-show-selection-table][data-sales-show-selection-cell][data-sales-show-selection-row]',
                );

            if (
                drag &&
                target?.dataset.salesShowSelectionTable === table &&
                target.dataset.salesShowSelectionRow &&
                target.dataset.salesShowSelectionCell === drag.field
            ) {
                const rowId = Number(target.dataset.salesShowSelectionRow);

                if (rowId !== drag.rowId) {
                    setSelection((current) => {
                        if (
                            current?.field === drag.field &&
                            current.rowId === rowId
                        ) {
                            return current;
                        }

                        return {
                            anchorId:
                                current?.field === drag.field &&
                                rowIds.includes(current.anchorId)
                                    ? current.anchorId
                                    : drag.rowId,
                            rowId,
                            field: drag.field,
                        };
                    });
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
                    `[data-sales-show-selection-table="${table}"], [data-sales-show-selection-statistics]`,
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
    }, [rowIds, table]);

    return {
        statistics,
        getSelectionCellProps,
    };
}
