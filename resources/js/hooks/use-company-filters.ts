import { formatDateDisplay } from '@/lib/date';
import type { Company } from '@/types/company';
import { useMemo, useState } from 'react';

export type CompanyFilterColumn = 'id' | 'name' | 'created_at';

interface ColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface CompanyFilters {
    search: string;
    columns: Partial<Record<CompanyFilterColumn, ColumnFilterValue>>;
}

const initialFilters: CompanyFilters = { search: '', columns: {} };

function getDateValue(value: string) {
    return value.slice(0, 10);
}

export function useCompanyFilters(companies: Company[]) {
    const [filters, setFilters] = useState<CompanyFilters>(initialFilters);

    const filteredCompanies = useMemo(() => {
        const query = filters.search.trim().toLocaleLowerCase('fr');

        return companies.filter((company) => {
            const dateValue = getDateValue(company.created_at);
            const matchesSearch =
                !query ||
                [
                    company.id,
                    company.name,
                    dateValue,
                    formatDateDisplay(company.created_at),
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('fr')
                        .includes(query),
                );

            const matchesColumns = (
                Object.entries(filters.columns) as [
                    CompanyFilterColumn,
                    ColumnFilterValue,
                ][]
            ).every(([column, filter]) => {
                if (column === 'name' && filter.values?.length) {
                    return filter.values.includes(company.name);
                }

                if (column === 'id' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || company.id >= Number(filter.min)) &&
                        (!filter.max || company.id <= Number(filter.max))
                    );
                }

                if (column === 'created_at' && (filter.min || filter.max)) {
                    return (
                        (!filter.min || dateValue >= filter.min) &&
                        (!filter.max || dateValue <= filter.max)
                    );
                }

                return true;
            });

            return matchesSearch && matchesColumns;
        });
    }, [companies, filters]);

    const activeFilterCount = Object.values(filters.columns).filter((filter) =>
        Boolean(filter?.values?.length || filter?.min || filter?.max),
    ).length;

    return {
        filters,
        setFilters,
        filteredCompanies,
        activeFilterCount,
        clearColumnFilters: () =>
            setFilters((current) => ({ ...current, columns: {} })),
    };
}
