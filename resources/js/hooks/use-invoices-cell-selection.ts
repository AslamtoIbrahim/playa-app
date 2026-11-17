import type { Invoice } from '@/types/invoice';
import { useCallback, useMemo, useState } from 'react';

export type InvoicesSelectionField =
    | 'invoice_number'
    | 'type'
    | 'date'
    | 'session_zone'
    | 'billable'
    | 'caution'
    | 'boxes'
    | 'amount'
    | 'status';

export interface InvoicesSelectionStatisticsData {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
}

interface InvoicesCellSelection {
    rowId: number;
    field: InvoicesSelectionField;
    anchorId: number;
}

const numericFields = new Set<InvoicesSelectionField>(['boxes', 'amount']);

const parseNumber = (value: string): number | null => {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
};

const getCellValue = (
    invoice: Invoice,
    field: InvoicesSelectionField,
): string => {
    switch (field) {
        case 'invoice_number':
            return invoice.invoice_number;
        case 'type':
            return invoice.type;
        case 'date':
            return invoice.date;
        case 'session_zone':
            return invoice.session_zone?.zone?.name ?? '';
        case 'billable':
            return invoice.billable?.name ?? '';
        case 'caution':
            return invoice.caution?.name ?? '';
        case 'boxes':
            return String(invoice.boxes || 0);
        case 'amount':
            return String(invoice.amount);
        case 'status':
            return invoice.status;
    }
};

export function useInvoicesCellSelection(invoices: Invoice[]) {
    const [selection, setSelection] = useState<InvoicesCellSelection | null>(
        null,
    );
    const rowIds = useMemo(
        () => invoices.map((invoice) => invoice.id),
        [invoices],
    );
    const activeSelection =
        selection &&
        rowIds.includes(selection.anchorId) &&
        rowIds.includes(selection.rowId)
            ? selection
            : null;

    const selectCell = useCallback(
        (rowId: number, field: InvoicesSelectionField, extend: boolean) => {
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
        (rowId: number, field: InvoicesSelectionField) => {
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

    const statistics = useMemo((): InvoicesSelectionStatisticsData | null => {
        if (!activeSelection) {
            return null;
        }

        const start = rowIds.indexOf(activeSelection.anchorId);
        const end = rowIds.indexOf(activeSelection.rowId);
        const selectedInvoices = invoices.slice(
            Math.min(start, end),
            Math.max(start, end) + 1,
        );
        const values = selectedInvoices.map((invoice) =>
            String(getCellValue(invoice, activeSelection.field) ?? ''),
        );
        const numeric = numericFields.has(activeSelection.field);
        const numbers = values
            .map((value) => (numeric ? parseNumber(value) : null))
            .filter((value): value is number => value !== null);
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
    }, [activeSelection, invoices, rowIds]);

    return {
        setSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics,
    };
}
