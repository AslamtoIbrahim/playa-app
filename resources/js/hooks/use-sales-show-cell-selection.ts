import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { SaleItem } from '@/types/sale-item';

export type SalesShowSelectionField =
    | 'boat'
    | 'item'
    | 'quantity'
    | 'sale_price'
    | 'real_price'
    | 'amount'
    | 'tax'
    | 'total_diff';

export interface SalesShowSelectionStatisticsData {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

interface CellSelection {
    anchorId: number;
    rowId: number;
    field: SalesShowSelectionField;
}

const numericFields = new Set<SalesShowSelectionField>([
    'quantity',
    'sale_price',
    'real_price',
    'amount',
    'tax',
    'total_diff',
]);

const getCellValue = (
    item: SaleItem,
    field: SalesShowSelectionField,
): string => {
    switch (field) {
        case 'boat':
            return item.boat?.name ?? item.invoice_item?.boat?.name ?? '—';
        case 'item':
            return item.item?.name ?? item.invoice_item?.category?.name ?? '—';
        case 'quantity':
            return String(Number(item.unit_count));
        case 'sale_price':
            return String(Number(item.sale_price));
        case 'real_price':
            return String(Number(item.real_price));
        case 'amount':
            return String(Number(item.amount));
        case 'tax':
            return String(Number(item.tax));
        case 'total_diff':
            return String(Number(item.total_diff));
    }
};

const parseNumber = (value: string): number | null => {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
};

export function useSalesShowCellSelection(items: SaleItem[]) {
    const [selection, setSelection] = useState<CellSelection | null>(null);
    const cellSelectDrag = useRef<{
        rowId: number;
        field: SalesShowSelectionField;
    } | null>(null);
    const rowIds = useMemo(() => items.map((item) => item.id), [items]);
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
        const values = items
            .slice(
                Math.min(anchorIndex, targetIndex),
                Math.max(anchorIndex, targetIndex) + 1,
            )
            .map((item) => getCellValue(item, activeSelection.field));
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
    }, [activeSelection, items, rowIds]);

    const getSelectedCellRange = (rowId: number): string | null => {
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
    };

    const getSelectionCellProps = (
        rowId: number,
        field: SalesShowSelectionField,
        selectedCell: string | null,
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
        const selected = selectedCell?.includes(`|${rowId}:${field}|`) ?? false;

        return {
            'data-sales-show-cell': field,
            'data-sales-show-row': rowId,
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
                    '[data-sales-show-cell][data-sales-show-row]',
                );

            if (
                drag &&
                target?.dataset.salesShowRow &&
                target.dataset.salesShowCell === drag.field
            ) {
                const rowId = Number(target.dataset.salesShowRow);

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
                    '[data-sales-show-cell], [data-sales-show-selection-statistics]',
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
    }, [rowIds]);

    return {
        statistics,
        getSelectedCellRange,
        getSelectionCellProps,
    };
}
