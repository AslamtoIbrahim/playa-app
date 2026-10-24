import { useCallback, useMemo, useState } from 'react';
import type { InvoiceItem } from '@/types/invoice-item';

export interface InvoiceCellSelection {
    rowId: number;
    field: string;
    value: string;
    anchorId: number;
}

const numericFields = new Set([
    'unit_count',
    'unit_price',
    'weight',
    'box',
    'amount',
]);

const parseNumber = (value: string): number | null => {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
};

export function useInvoiceCellSelection(items: InvoiceItem[]) {
    const [selection, setSelection] = useState<InvoiceCellSelection | null>(
        null,
    );
    const rowIds = useMemo(
        () => [-1, ...items.map((item) => item.id)],
        [items],
    );

    const selectCell = useCallback(
        (rowId: number, field: string, value: string, extend: boolean) => {
            setSelection((current) => ({
                rowId,
                field,
                value,
                anchorId:
                    extend && current?.field === field
                        ? current.anchorId
                        : rowId,
            }));
        },
        [],
    );

    const extendSelection = useCallback(
        (rowId: number, field: string, value: string) => {
            setSelection((current) => ({
                rowId,
                field,
                value,
                anchorId:
                    current?.field === field
                        ? current.anchorId
                        : (current?.rowId ?? rowId),
            }));
        },
        [],
    );

    const getSelectedCellRange = useCallback(
        (rowId: number): string | null => {
            if (!selection || selection.field === '') {
                return null;
            }

            const index = rowIds.indexOf(rowId);
            const anchor = rowIds.indexOf(selection.anchorId);
            const target = rowIds.indexOf(selection.rowId);

            if (
                index < Math.min(anchor, target) ||
                index > Math.max(anchor, target)
            ) {
                return null;
            }

            return `|${rowIds
                .slice(Math.min(anchor, target), Math.max(anchor, target) + 1)
                .map((id) => `${id}:${selection.field}`)
                .join('|')}|`;
        },
        [rowIds, selection],
    );

    const statistics = useMemo(() => {
        if (!selection) {
            return null;
        }

        const start = rowIds.indexOf(selection.anchorId);
        const end = rowIds.indexOf(selection.rowId);
        const ids = rowIds.slice(
            Math.min(start, end),
            Math.max(start, end) + 1,
        );
        const values = ids.map((id) => {
            if (id === -1) {
                return selection.rowId === -1 ? selection.value : '';
            }

            const item = items.find((row) => row.id === id);

            return String(item?.[selection.field as keyof InvoiceItem] ?? '');
        });
        const numbers = values
            .map(parseNumber)
            .filter((value): value is number => value !== null);
        const count = values.filter((value) => value.trim() !== '').length;
        const sum = numbers.reduce((total, value) => total + value, 0);
        const numeric = numericFields.has(selection.field);

        return {
            primary: numeric ? sum : count,
            numeric,
            sum,
            average: numbers.length ? sum / numbers.length : null,
            minimum: numbers.length ? Math.min(...numbers) : null,
            maximum: numbers.length ? Math.max(...numbers) : null,
            count,
            countNumbers: numbers.length,
        };
    }, [items, rowIds, selection]);

    return {
        selection,
        setSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics,
        rowIds,
    };
}
