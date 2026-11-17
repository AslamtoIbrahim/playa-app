import type { Sale } from '@/types/sale';
import { useCallback, useMemo, useState } from 'react';

export type SaleSelectionField =
    | 'id'
    | 'date'
    | 'customer'
    | 'session'
    | 'type'
    | 'boxes'
    | 'weight'
    | 'amount';

export interface SaleSelectionStatisticsData {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

interface SaleCellSelection {
    rowId: number;
    field: SaleSelectionField;
    anchorId: number;
}

const numericFields = new Set<SaleSelectionField>([
    'boxes',
    'weight',
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

const getCellValue = (sale: Sale, field: SaleSelectionField): string => {
    switch (field) {
        case 'id':
            return String(sale.id);
        case 'date':
            return sale.date;
        case 'customer':
            return sale.owner?.name || 'Client Divers';
        case 'session':
            return sale.session?.session_date ?? '';
        case 'type':
            return sale.type;
        case 'boxes':
            return String(sale.boxes);
        case 'weight':
            return String(sale.weight);
        case 'amount':
            return String(sale.amount);
    }
};

export function useSaleTableCellSelection(sales: Sale[]) {
    const [selection, setSelection] = useState<SaleCellSelection | null>(null);
    const rowIds = useMemo(() => sales.map((sale) => sale.id), [sales]);
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;

    const selectCell = useCallback(
        (rowId: number, field: SaleSelectionField, extend: boolean) => {
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
        (rowId: number, field: SaleSelectionField) => {
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

    const statistics = useMemo((): SaleSelectionStatisticsData | null => {
        if (!activeSelection) {
            return null;
        }

        const start = rowIds.indexOf(activeSelection.anchorId);
        const end = rowIds.indexOf(activeSelection.rowId);
        const selectedSales = sales.slice(
            Math.min(start, end),
            Math.max(start, end) + 1,
        );
        const values = selectedSales.map((sale) =>
            getCellValue(sale, activeSelection.field),
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
    }, [activeSelection, rowIds, sales]);

    return {
        setSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics,
    };
}
