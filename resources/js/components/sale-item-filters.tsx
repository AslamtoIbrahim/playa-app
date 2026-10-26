import { Filter, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { TableHead, TableRow } from '@/components/ui/table';
import type {
    SaleItemFilterColumn,
    SaleItemFilters as Filters,
} from '@/hooks/use-sale-item-filters';
import { cn } from '@/lib/utils';
import type { SaleItem } from '@/types/sale-item';

interface SaleGlobalSearchProps {
    value: string;
    onChange: (value: string) => void;
    showColumnFilters: boolean;
    activeFilterCount: number;
    onToggleColumnFilters: () => void;
}

export function SaleGlobalSearch({
    value,
    onChange,
    showColumnFilters,
    activeFilterCount,
    onToggleColumnFilters,
}: SaleGlobalSearchProps) {
    return (
        <div className="flex w-full max-w-sm items-center gap-2 print:hidden">
            <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Rechercher dans toutes les colonnes…"
                    aria-label="Rechercher dans toutes les colonnes"
                    className="h-9 rounded-full border-orange-200/70 bg-background/80 pr-9 pl-9 shadow-sm transition-shadow focus-visible:shadow-md dark:border-orange-900/60"
                />
                {value && (
                    <button
                        type="button"
                        aria-label="Effacer la recherche"
                        onClick={() => onChange('')}
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>
            <Button
                type="button"
                variant={
                    showColumnFilters || activeFilterCount > 0
                        ? 'secondary'
                        : 'outline'
                }
                size="icon"
                aria-label={
                    showColumnFilters
                        ? 'Masquer les filtres de colonnes'
                        : 'Afficher les filtres de colonnes'
                }
                aria-pressed={showColumnFilters}
                title={
                    showColumnFilters
                        ? 'Masquer les filtres de colonnes'
                        : 'Afficher les filtres de colonnes'
                }
                onClick={onToggleColumnFilters}
                className={cn(
                    'relative size-9 shrink-0 rounded-full transition-all',
                    (showColumnFilters || activeFilterCount > 0) &&
                        'border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300 dark:hover:bg-orange-950',
                )}
            >
                <Filter className="size-4" />
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-semibold text-white ring-2 ring-background dark:bg-orange-500">
                        {activeFilterCount}
                    </span>
                )}
            </Button>
        </div>
    );
}

interface SaleColumnTotalsProps {
    items: SaleItem[];
    visible: boolean;
}

const formatTotal = (value: number) =>
    value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

function TotalBadge({
    value,
    tone = 'neutral',
}: {
    value: number;
    tone?: 'neutral' | 'orange' | 'green' | 'diff';
}) {
    const diffTone =
        value < 0
            ? 'text-red-700 dark:text-red-300'
            : value > 0
              ? 'text-green-700 dark:text-green-300'
              : 'text-slate-800 dark:text-neutral-100';
    const toneClass =
        tone === 'orange'
            ? 'text-orange-700 dark:text-orange-300'
            : tone === 'green'
              ? 'text-emerald-700 dark:text-emerald-300'
              : tone === 'diff'
                ? diffTone
                : 'text-slate-800 dark:text-neutral-100';

    return (
        <span
            className={cn(
                'inline-flex min-w-14 items-center justify-center rounded-lg bg-white px-2.5 py-0.5 text-xs font-bold tracking-tight tabular-nums shadow-sm ring-1 ring-orange-200/80 dark:bg-neutral-800 dark:ring-neutral-700',
                toneClass,
            )}
        >
            {formatTotal(value)}
        </span>
    );
}

export function SaleColumnTotals({ items, visible }: SaleColumnTotalsProps) {
    if (!visible) {
        return null;
    }

    const totals = items.reduce(
        (result, item) => ({
            quantity: result.quantity + Math.abs(Number(item.unit_count) || 0),
            salePrice: result.salePrice + (Number(item.sale_price) || 0),
            realPrice: result.realPrice + (Number(item.real_price) || 0),
            amount: result.amount + Math.abs(Number(item.amount) || 0),
            tax: result.tax + Math.abs(Number(item.tax) || 0),
            difference: result.difference + (Number(item.total_diff) || 0),
        }),
        {
            quantity: 0,
            salePrice: 0,
            realPrice: 0,
            amount: 0,
            tax: 0,
            difference: 0,
        },
    );

    return (
        <TableRow
            aria-label="Totaux des lignes de vente affichées"
            className="h-11 border-b border-orange-200/80 bg-linear-to-r from-white via-orange-50/70 to-white hover:from-white hover:via-orange-50/70 hover:to-white dark:border-neutral-800 dark:from-neutral-900 dark:via-orange-950/15 dark:to-neutral-900 dark:hover:from-neutral-900 dark:hover:via-orange-950/15 dark:hover:to-neutral-900"
        >
            <TableHead colSpan={2} className="pl-4">
                <span className="text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                    Totaux · {items.length} lignes
                </span>
            </TableHead>
            <TableHead className="text-center">
                <TotalBadge value={totals.quantity} />
            </TableHead>
            <TableHead className="text-center">
                <TotalBadge value={totals.salePrice} tone="orange" />
            </TableHead>
            <TableHead className="text-center">
                <TotalBadge value={totals.realPrice} tone="orange" />
            </TableHead>
            <TableHead className="text-center">
                <TotalBadge value={totals.amount} tone="green" />
            </TableHead>
            <TableHead className="text-center">
                <TotalBadge value={totals.tax} tone="orange" />
            </TableHead>
            <TableHead className="text-center">
                <TotalBadge value={totals.difference} tone="diff" />
            </TableHead>
        </TableRow>
    );
}

interface SaleColumnFilterProps {
    column: SaleItemFilterColumn;
    title: string;
    options?: string[];
    filters: Filters;
    setFilters: Dispatch<SetStateAction<Filters>>;
}

export function SaleColumnFilter({
    column,
    title,
    options,
    filters,
    setFilters,
}: SaleColumnFilterProps) {
    const [optionSearch, setOptionSearch] = useState('');
    const value = filters.columns[column];
    const active = Boolean(
        value && ((value.values?.length ?? 0) > 0 || value.min || value.max),
    );
    const normalizedOptionSearch = optionSearch.trim().toLocaleLowerCase('fr');
    const filteredOptions = options?.filter((option) =>
        option.toLocaleLowerCase('fr').includes(normalizedOptionSearch),
    );

    const update = (next: NonNullable<typeof value>) =>
        setFilters((current) => ({
            ...current,
            columns: { ...current.columns, [column]: next },
        }));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    data-column-filter-trigger
                    aria-label={`Filtrer : ${title}`}
                    title={`Filtrer : ${title}`}
                    className={cn(
                        'ml-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-orange-100 hover:text-orange-800 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:hover:bg-orange-950/50 dark:hover:text-orange-300',
                        active &&
                            'bg-orange-100 text-orange-800 ring-1 ring-orange-300/70 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-800',
                    )}
                >
                    <Filter className="size-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-64 gap-3 rounded-xl border-orange-200/70 p-3 shadow-lg dark:border-neutral-700"
            >
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Filtrer : {title}</p>
                    {active && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                                update({ values: [], min: '', max: '' })
                            }
                        >
                            Effacer
                        </Button>
                    )}
                </div>
                {options ? (
                    <>
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={optionSearch}
                                onChange={(event) =>
                                    setOptionSearch(event.target.value)
                                }
                                placeholder={`Rechercher ${title.toLocaleLowerCase('fr')}…`}
                                aria-label={`Rechercher ${title.toLocaleLowerCase('fr')}`}
                                className="h-9 pl-9"
                            />
                        </div>
                        <div className="max-h-52 space-y-1 overflow-y-auto">
                            {filteredOptions?.map((option) => {
                                const checked =
                                    value?.values?.includes(option) ?? false;

                                return (
                                    <label
                                        key={option}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(checked) =>
                                                update({
                                                    values:
                                                        checked === true
                                                            ? [
                                                                  ...(value?.values ??
                                                                      []),
                                                                  option,
                                                              ]
                                                            : (
                                                                  value?.values ??
                                                                  []
                                                              ).filter(
                                                                  (entry) =>
                                                                      entry !==
                                                                      option,
                                                              ),
                                                    min: value?.min ?? '',
                                                    max: value?.max ?? '',
                                                })
                                            }
                                        />
                                        <span className="truncate">
                                            {option}
                                        </span>
                                    </label>
                                );
                            })}
                            {filteredOptions?.length === 0 && (
                                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                                    {normalizedOptionSearch
                                        ? 'Aucun résultat'
                                        : 'Aucune valeur disponible'}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            aria-label={`${title} minimum`}
                            placeholder="Minimum"
                            value={value?.min ?? ''}
                            onChange={(event) =>
                                update({
                                    values: [],
                                    min: event.target.value,
                                    max: value?.max ?? '',
                                })
                            }
                            className="h-9"
                        />
                        <Input
                            type="number"
                            aria-label={`${title} maximum`}
                            placeholder="Maximum"
                            value={value?.max ?? ''}
                            onChange={(event) =>
                                update({
                                    values: [],
                                    min: value?.min ?? '',
                                    max: event.target.value,
                                })
                            }
                            className="h-9"
                        />
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
