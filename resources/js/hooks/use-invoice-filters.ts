import { format } from 'date-fns';
import { useMemo, useState } from 'react';

import type { Invoice } from '@/types/invoice';

export type InvoiceFilterColumn =
    | 'invoice_number'
    | 'type'
    | 'date'
    | 'session_zone'
    | 'billable'
    | 'caution'
    | 'boxes'
    | 'amount'
    | 'status';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface InvoiceFilters {
    search: string;
    columns: Partial<Record<InvoiceFilterColumn, ColumnFilterValue>>;
}

interface FilterOption {
    label: string;
    value: string;
}

const initialFilters: InvoiceFilters = { search: '', columns: {} };

const statusLabels: Record<Invoice['status'], string> = {
    paid: 'paid',
    partially_paid: 'partially paid',
    unpaid: 'unpaid',
    pending: 'pending',
};

function getSessionZoneLabel(invoice: Invoice): string {
    const zone = invoice.session_zone?.zone?.name ?? 'Inconnue';
    const sessionDate = invoice.session_zone?.daily_session?.session_date;
    const date = sessionDate
        ? format(new Date(sessionDate), 'dd/MM/yy')
        : 'N/A';

    return `${zone} · ${date}`;
}

function getColumnValue(
    invoice: Invoice,
    column: InvoiceFilterColumn,
): string | number {
    switch (column) {
        case 'invoice_number':
            return Number(invoice.invoice_number) || 0;
        case 'type':
            return invoice.type;
        case 'date':
            return invoice.date.slice(0, 10);
        case 'session_zone':
            return getSessionZoneLabel(invoice);
        case 'billable':
            return invoice.billable?.name ?? '---';
        case 'caution':
            return invoice.caution?.name ?? 'Aucune';
        case 'boxes':
            return Number(invoice.boxes) || 0;
        case 'amount':
            return Number(invoice.amount) || 0;
        case 'status':
            return invoice.status;
    }
}

function getSearchValues(invoice: Invoice): (string | number)[] {
    const sessionDate = invoice.session_zone?.daily_session?.session_date;
    const amount = Number(invoice.amount) || 0;

    return [
        invoice.invoice_number,
        invoice.type,
        invoice.type === 'sale' ? 'Vente' : 'Achat',
        invoice.date,
        format(new Date(invoice.date), 'dd/MM/yyyy'),
        getSessionZoneLabel(invoice),
        invoice.session_zone?.zone?.name ?? 'Inconnue',
        sessionDate ?? '',
        sessionDate ? format(new Date(sessionDate), 'dd/MM/yy') : 'N/A',
        invoice.session_zone?.daily_session?.status ?? '',
        invoice.billable?.name ?? '---',
        invoice.billable_type,
        invoice.billable_type.includes('Customer') ? 'Client' : 'Société',
        invoice.caution?.name ?? 'Aucune',
        invoice.boxes,
        amount,
        amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
        invoice.status,
        statusLabels[invoice.status],
        invoice.weight ?? '',
        invoice.tva,
        invoice.total_paid ?? '',
        invoice.created_by ?? '',
        invoice.created_at,
        invoice.updated_at,
    ];
}

function getFilterOptions(
    invoices: Invoice[],
    column: 'type' | 'session_zone' | 'billable' | 'caution' | 'status',
): FilterOption[] {
    const values = new Map<string, string>();

    for (const invoice of invoices) {
        let value: string;
        let label: string;

        switch (column) {
            case 'type':
                value = invoice.type;
                label = invoice.type === 'sale' ? 'Vente' : 'Achat';
                break;
            case 'session_zone':
                value = getSessionZoneLabel(invoice);
                label = value;
                break;
            case 'billable':
                value = invoice.billable?.name ?? '---';
                label = value;
                break;
            case 'caution':
                value = invoice.caution?.name ?? 'Aucune';
                label = value;
                break;
            case 'status':
                value = invoice.status;
                label = statusLabels[invoice.status];
                break;
        }

        values.set(value, label);
    }

    return Array.from(values, ([value, label]) => ({ value, label }));
}

export function useInvoiceFilters(invoices: Invoice[]) {
    const [filters, setFilters] = useState<InvoiceFilters>(initialFilters);

    const filteredInvoices = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return invoices.filter((invoice) => {
            const matchesSearch =
                !query ||
                getSearchValues(invoice).some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    InvoiceFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                const value = getColumnValue(invoice, column);

                if (column === 'date') {
                    const dateValue = String(value);

                    if (!dateValue && (filter.min || filter.max)) {
                        return false;
                    }

                    return (
                        (!filter.min || dateValue >= filter.min) &&
                        (!filter.max || dateValue <= filter.max)
                    );
                }

                if (filter.values?.length) {
                    return filter.values.includes(String(value));
                }

                if (filter.min || filter.max) {
                    const numericValue = Number(value);

                    return (
                        (!filter.min || numericValue >= Number(filter.min)) &&
                        (!filter.max || numericValue <= Number(filter.max))
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [filters, invoices]);

    const filterOptions = useMemo(
        () => ({
            type: getFilterOptions(invoices, 'type'),
            session_zone: getFilterOptions(invoices, 'session_zone'),
            billable: getFilterOptions(invoices, 'billable'),
            caution: getFilterOptions(invoices, 'caution'),
            status: getFilterOptions(invoices, 'status'),
        }),
        [invoices],
    );

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredInvoices,
        filterOptions,
        activeFilterCount,
        clearColumnFilters: () =>
            setFilters((current) => ({ ...current, columns: {} })),
    };
}
