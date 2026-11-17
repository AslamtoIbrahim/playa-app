import type { Receipt } from '@/types/receipt';
import { useCallback, useMemo, useState } from 'react';

export type ReceiptSelectionField =
    | 'id'
    | 'date'
    | 'customer'
    | 'session_date'
    | 'zone'
    | 'total_amount'
    | 'total_boxes';

export interface ReceiptSelectionStatisticsData {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

interface ReceiptCellSelection {
    rowId: number;
    field: ReceiptSelectionField;
    anchorId: number;
}

const numericFields = new Set<ReceiptSelectionField>([
    'total_amount',
    'total_boxes',
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
    receipt: Receipt,
    field: ReceiptSelectionField,
): string => {
    switch (field) {
        case 'id':
            return String(receipt.id);
        case 'date':
            return receipt.date;
        case 'customer':
            return receipt.customer?.name || '---';
        case 'session_date':
            return receipt.session_zone?.daily_session?.session_date || '-';
        case 'zone':
            return receipt.session_zone?.zone?.name || '-';
        case 'total_amount':
            return String(receipt.total_amount);
        case 'total_boxes':
            return String(receipt.total_boxes || 0);
    }
};

export function useReceiptCellSelection(receipts: Receipt[]) {
    const [selection, setSelection] = useState<ReceiptCellSelection | null>(
        null,
    );
    const rowIds = useMemo(
        () => receipts.map((receipt) => receipt.id),
        [receipts],
    );
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;

    const selectCell = useCallback(
        (rowId: number, field: ReceiptSelectionField, extend: boolean) => {
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
        (rowId: number, field: ReceiptSelectionField) => {
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

    const statistics = useMemo((): ReceiptSelectionStatisticsData | null => {
        if (!activeSelection) {
            return null;
        }

        const start = rowIds.indexOf(activeSelection.anchorId);
        const end = rowIds.indexOf(activeSelection.rowId);
        const selectedReceipts = receipts.slice(
            Math.min(start, end),
            Math.max(start, end) + 1,
        );
        const values = selectedReceipts.map((receipt) =>
            getCellValue(receipt, activeSelection.field),
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
    }, [activeSelection, receipts, rowIds]);

    return {
        setSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics,
    };
}
