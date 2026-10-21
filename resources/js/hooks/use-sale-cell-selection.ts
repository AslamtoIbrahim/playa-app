import type { InvoiceItem } from '@/types/invoice-item';
import { toast } from 'sonner';
import type {
    Dispatch,
    KeyboardEvent,
    MouseEvent,
    SetStateAction,
} from 'react';
import { useRef, useState } from 'react';

type FillableColumn = 'client' | 'salePrice' | 'article';

interface CellRange {
    column: FillableColumn;
    startRow: number;
    endRow: number;
}

export function useSaleCellSelection(items: InvoiceItem[]) {
    const [cellRange, setCellRange] = useState<CellRange | null>(null);
    const rangeAnchor = useRef<{
        column: FillableColumn;
        row: number;
    } | null>(null);
    const suppressClick = useRef(false);

    const selectCellRange = (
        event: MouseEvent<HTMLTableCellElement>,
        column: FillableColumn,
        row: number,
    ): void => {
        if (event.shiftKey && rangeAnchor.current?.column === column) {
            event.preventDefault();
            event.currentTarget.focus();
            suppressClick.current = true;
            setCellRange({
                column,
                startRow: rangeAnchor.current.row,
                endRow: row,
            });

            return;
        }

        rangeAnchor.current = { column, row };
        setCellRange(null);
    };

    const suppressCellClick = (
        event: MouseEvent<HTMLTableCellElement>,
    ): void => {
        if (!suppressClick.current) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
    };

    const isCellInRange = (column: FillableColumn, row: number): boolean => {
        if (cellRange?.column !== column) {
            return false;
        }

        return (
            row >= Math.min(cellRange.startRow, cellRange.endRow) &&
            row <= Math.max(cellRange.startRow, cellRange.endRow)
        );
    };

    const fillSelectedCells = (
        event: KeyboardEvent<HTMLElement>,
        column: FillableColumn,
        rowIndex: number,
        setValues: Dispatch<SetStateAction<Record<string, string>>>,
        getValue: (item: InvoiceItem, index: number) => string,
        isTargetAllowed: (
            item: InvoiceItem,
            sourceItem: InvoiceItem,
            targetIndex: number,
            sourceIndex: number,
        ) => boolean = () => true,
        getKey: (item: InvoiceItem, index: number) => string = (item) =>
            `item-${item.id}`,
        onFilled?: (targetIndexes: number[], value: string) => void,
    ): void => {
        if (
            !(event.ctrlKey || event.metaKey) ||
            event.key.toLowerCase() !== 'd'
        ) {
            return;
        }

        const range =
            cellRange?.column === column &&
            rowIndex >= Math.min(cellRange.startRow, cellRange.endRow) &&
            rowIndex <= Math.max(cellRange.startRow, cellRange.endRow)
                ? {
                      start: Math.min(cellRange.startRow, cellRange.endRow),
                      end: Math.max(cellRange.startRow, cellRange.endRow),
                  }
                : null;

        if (!range) {
            return;
        }

        event.preventDefault();
        const sourceItem = items[range.start];
        const value = sourceItem ? getValue(sourceItem, range.start) : '';

        if (!value) {
            toast.error('Choisissez d’abord une valeur à recopier.');

            return;
        }

        const targetIndexes = items
            .map((targetItem, index) => ({ targetItem, index }))
            .slice(range.start + 1, range.end + 1)
            .filter(({ targetItem, index }) =>
                sourceItem
                    ? isTargetAllowed(
                          targetItem,
                          sourceItem,
                          index,
                          range.start,
                      )
                    : false,
            )
            .map(({ index }) => index);

        if (targetIndexes.length > 0) {
            setValues((current) => ({
                ...current,
                ...Object.fromEntries(
                    targetIndexes.map((index) => [
                        getKey(items[index], index),
                        value,
                    ]),
                ),
            }));
            onFilled?.(targetIndexes, value);
        }

        setCellRange(null);
        rangeAnchor.current = null;
    };

    return {
        fillSelectedCells,
        isCellInRange,
        selectCellRange,
        suppressCellClick,
    };
}
