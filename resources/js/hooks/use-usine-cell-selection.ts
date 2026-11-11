import type { ReceptionRecordFilterColumn } from '@/hooks/use-reception-record-filters';
import type { ReceptionRecord } from '@/types/reception-record';
import { useCallback, useMemo, useState } from 'react';

export interface UsineCellSelection {
    rowId: number;
    anchorId: number;
    field: ReceptionRecordFilterColumn;
}

export interface UsineSelectionStatistics {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

const numericFields = new Set<ReceptionRecordFilterColumn>([
    'weight',
    'ttc',
    'averagePrice',
    'amount',
    'margin',
    'sale',
    'reference',
]);

const parseNumber = (value: string | number): number | null => {
    const normalized = String(value)
        .trim()
        .replace(/\s/g, '')
        .replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
};

const getCellValue = (
    record: ReceptionRecord,
    field: ReceptionRecordFilterColumn,
): string => {
    const weight = Number(record.weight) || 0;
    const amount = Number(record.amount) || 0;
    const margin = Number(record.margin_percentage) || 0;

    switch (field) {
        case 'date':
            return record.session_date;
        case 'weight':
            return record.weight;
        case 'designation':
            return record.designation;
        case 'origin':
            return record.origin;
        case 'ttc':
            return record.ttc;
        case 'averagePrice':
            return String(weight > 0 ? amount / weight : 0);
        case 'amount':
            return record.amount;
        case 'margin':
            return record.margin_percentage;
        case 'sale':
            return String(amount + weight * margin);
        case 'invoiced':
            return record.is_invoiced ? 'V' : 'F';
        case 'reference':
            return record.invoice_reference === null
                ? ''
                : String(record.invoice_reference);
    }
};

export function useUsineCellSelection(records: ReceptionRecord[]) {
    const [selection, setSelection] = useState<UsineCellSelection | null>(null);
    const rowIds = useMemo(() => records.map((record) => record.id), [records]);
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;

    const selectCell = useCallback(
        (
            rowId: number,
            field: ReceptionRecordFilterColumn,
            extend: boolean,
        ) => {
            setSelection((current) => ({
                rowId,
                field,
                anchorId:
                    extend &&
                    current?.field === field &&
                    rowIds.includes(current.anchorId) &&
                    rowIds.includes(current.rowId)
                        ? current.anchorId
                        : rowId,
            }));
        },
        [rowIds],
    );

    const extendSelection = useCallback(
        (rowId: number, field: ReceptionRecordFilterColumn) => {
            setSelection((current) => ({
                rowId,
                field,
                anchorId:
                    current?.field === field &&
                    rowIds.includes(current.anchorId) &&
                    rowIds.includes(current.rowId)
                        ? current.anchorId
                        : current && rowIds.includes(current.rowId)
                          ? current.rowId
                          : rowId,
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

    const statistics = useMemo((): UsineSelectionStatistics | null => {
        if (!activeSelection) {
            return null;
        }

        const start = rowIds.indexOf(activeSelection.anchorId);
        const end = rowIds.indexOf(activeSelection.rowId);

        if (start < 0 || end < 0) {
            return null;
        }

        const selectedRecords = records.slice(
            Math.min(start, end),
            Math.max(start, end) + 1,
        );
        const values = selectedRecords.map((record) =>
            getCellValue(record, activeSelection.field),
        );
        const numbers = values
            .map(parseNumber)
            .filter((value): value is number => value !== null);
        const count = numericFields.has(activeSelection.field)
            ? numbers.length
            : values.filter((value) => String(value).trim() !== '').length;
        const sum = numbers.reduce((total, value) => total + value, 0);
        const numeric = numericFields.has(activeSelection.field);

        return {
            primary: numeric ? sum : count,
            numeric,
            sum,
            average: numbers.length ? sum / numbers.length : null,
            minimum: numbers.length ? Math.min(...numbers) : null,
            maximum: numbers.length ? Math.max(...numbers) : null,
            count: numbers.length,
        };
    }, [activeSelection, records, rowIds]);

    return {
        selection: activeSelection,
        setSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics,
        rowIds,
    };
}
