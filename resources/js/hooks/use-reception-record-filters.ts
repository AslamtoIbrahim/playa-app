import { useMemo, useState } from 'react';
import { formatDateDisplay } from '@/lib/date';
import type { ReceptionRecord } from '@/types/reception-record';

export type ReceptionRecordFilterColumn =
    | 'date'
    | 'weight'
    | 'designation'
    | 'origin'
    | 'ttc'
    | 'averagePrice'
    | 'amount'
    | 'margin'
    | 'sale'
    | 'invoiced'
    | 'reference';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface ReceptionRecordFilters {
    search: string;
    columns: Partial<Record<ReceptionRecordFilterColumn, ColumnFilterValue>>;
}

export interface ReceptionRecordFilterOption {
    value: string;
    label: string;
}

export interface ReceptionRecordTotals {
    weight: number;
    ttc: number;
    averagePrice: number;
    amount: number;
    margin: number;
    sale: number;
}

const initialFilters: ReceptionRecordFilters = { search: '', columns: {} };

const toNumber = (value: string | number | null): number => Number(value) || 0;

const getDerivedValues = (record: ReceptionRecord) => {
    const weight = toNumber(record.weight);
    const amount = toNumber(record.amount);
    const margin = toNumber(record.margin_percentage);

    return {
        weight,
        ttc: toNumber(record.ttc),
        averagePrice: weight > 0 ? amount / weight : 0,
        amount,
        margin,
        sale: amount + weight * margin,
        reference:
            record.invoice_reference === null
                ? null
                : Number(record.invoice_reference),
    };
};

const getColumnValue = (
    record: ReceptionRecord,
    column: ReceptionRecordFilterColumn,
): string | number | null => {
    switch (column) {
        case 'date':
            return record.session_date;
        case 'weight':
            return getDerivedValues(record).weight;
        case 'designation':
            return record.designation;
        case 'origin':
            return record.origin;
        case 'ttc':
            return getDerivedValues(record).ttc;
        case 'averagePrice':
            return getDerivedValues(record).averagePrice;
        case 'amount':
            return getDerivedValues(record).amount;
        case 'margin':
            return getDerivedValues(record).margin;
        case 'sale':
            return getDerivedValues(record).sale;
        case 'invoiced':
            return record.is_invoiced ? 'V' : 'F';
        case 'reference':
            return getDerivedValues(record).reference;
    }
};

const formatNumber = (value: number): string =>
    value.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const getSearchValues = (record: ReceptionRecord): string[] => {
    const values = getDerivedValues(record);

    return [
        record.session_date,
        formatDateDisplay(record.session_date),
        String(values.weight),
        formatNumber(values.weight),
        record.designation,
        record.origin || '—',
        String(values.ttc),
        formatNumber(values.ttc),
        String(values.averagePrice),
        formatNumber(values.averagePrice),
        String(values.amount),
        formatNumber(values.amount),
        String(values.margin),
        formatNumber(values.margin),
        String(values.sale),
        formatNumber(values.sale),
        record.is_invoiced ? 'V' : 'F',
        record.is_invoiced ? 'facturée' : 'non facturée',
        record.invoice_reference === null
            ? '—'
            : String(record.invoice_reference),
    ];
};

const normalize = (value: string): string => value.toLocaleLowerCase('fr-FR');

export function useReceptionRecordFilters(records: ReceptionRecord[]) {
    const [filters, setFilters] =
        useState<ReceptionRecordFilters>(initialFilters);

    const filteredRecords = useMemo(() => {
        const query = normalize(filters.search.trim());

        return records.filter((record) => {
            const matchesSearch =
                !query ||
                getSearchValues(record).some((value) =>
                    normalize(value).includes(query),
                );
            const matchesColumns = (
                Object.entries(filters.columns) as [
                    ReceptionRecordFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                const value = getColumnValue(record, column);

                if (filter.values?.length) {
                    return filter.values.includes(String(value ?? ''));
                }

                if (filter.min || filter.max) {
                    const numericValue =
                        value === null || value === ''
                            ? Number.NaN
                            : Number(value);

                    return (
                        Number.isFinite(numericValue) &&
                        (!filter.min || numericValue >= Number(filter.min)) &&
                        (!filter.max || numericValue <= Number(filter.max))
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [filters, records]);

    const optionsByColumn = useMemo(() => {
        const optionColumns = [
            'date',
            'designation',
            'origin',
            'invoiced',
        ] as const;

        return Object.fromEntries(
            optionColumns.map((column) => {
                const values = Array.from(
                    new Set(
                        records.map((record) =>
                            String(getColumnValue(record, column) ?? ''),
                        ),
                    ),
                ).sort((left, right) => left.localeCompare(right, 'fr'));

                return [
                    column,
                    values.map((value) => ({
                        value,
                        label:
                            column === 'date'
                                ? formatDateDisplay(value)
                                : column === 'invoiced'
                                  ? value === 'V'
                                      ? 'Facturée'
                                      : 'Non facturée'
                                  : value || '—',
                    })),
                ];
            }),
        ) as Record<
            (typeof optionColumns)[number],
            ReceptionRecordFilterOption[]
        >;
    }, [records]);

    const totals = useMemo(
        () =>
            filteredRecords.reduce<ReceptionRecordTotals>(
                (result, record) => {
                    const values = getDerivedValues(record);

                    return {
                        weight: result.weight + values.weight,
                        ttc: result.ttc + values.ttc,
                        averagePrice: result.averagePrice + values.amount,
                        amount: result.amount + values.amount,
                        margin: result.margin + values.weight * values.margin,
                        sale: result.sale + values.sale,
                    };
                },
                {
                    weight: 0,
                    ttc: 0,
                    averagePrice: 0,
                    amount: 0,
                    margin: 0,
                    sale: 0,
                },
            ),
        [filteredRecords],
    );

    const activeColumnFilterCount = Object.values(filters.columns).filter(
        (filter) =>
            Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;
    const hasActiveFilters = Boolean(
        filters.search.trim() || activeColumnFilterCount,
    );

    return {
        filters,
        setFilters,
        filteredRecords,
        optionsByColumn,
        totals: {
            ...totals,
            averagePrice:
                totals.weight > 0 ? totals.averagePrice / totals.weight : 0,
            margin: totals.weight > 0 ? totals.margin / totals.weight : 0,
        },
        activeFilterCount:
            activeColumnFilterCount + (filters.search.trim() ? 1 : 0),
        hasActiveFilters,
        clearFilters: () => setFilters(initialFilters),
    };
}
