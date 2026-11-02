import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    AttendanceItemFilterColumn,
    AttendanceItemFilters as Filters,
} from '@/hooks/use-attendance-item-filters';
import { cn } from '@/lib/utils';
import type { AttendanceItem } from '@/types/attendance-item';
import { ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { TableHead, TableRow } from '@/components/ui/table';

interface AttendanceItemSearchProps {
    value: string;
    onChange: (value: string) => void;
    showColumnFilters: boolean;
    activeFilterCount: number;
    onToggleColumnFilters: () => void;
}

export function AttendanceItemSearch({
    value,
    onChange,
    showColumnFilters,
    activeFilterCount,
    onToggleColumnFilters,
}: AttendanceItemSearchProps) {
    return (
        <div className="flex w-full max-w-sm items-center gap-2 print:hidden">
            <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Recherche dans toutes les colonnes…"
                    aria-label="Recherche dans toutes les colonnes"
                    className="h-9 rounded-full border-border/70 bg-background/80 pr-9 pl-9 shadow-sm transition-shadow focus-visible:shadow-md"
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
                        'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15',
                )}
            >
                <Filter className="size-4" />
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
                        {activeFilterCount}
                    </span>
                )}
            </Button>
        </div>
    );
}

interface AttendanceItemColumnFilterProps {
    column: AttendanceItemFilterColumn;
    title: string;
    options?: string[];
    filters: Filters;
    setFilters: Dispatch<SetStateAction<Filters>>;
}

export function AttendanceItemColumnFilter({
    column,
    title,
    options,
    filters,
    setFilters,
}: AttendanceItemColumnFilterProps) {
    const [optionSearch, setOptionSearch] = useState('');
    const value = filters.columns[column];
    const active = Boolean(
        value && (value.values?.length || value.min || value.max),
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
                        'ml-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        active &&
                            'bg-primary/15 text-primary ring-1 ring-primary/20',
                    )}
                >
                    <Filter className="size-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-64 gap-3 rounded-xl border-border/70 p-3 shadow-lg"
            >
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Filtrer : {title}</p>
                    {active && (
                        <Button
                            type="button"
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
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/70"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(checked) =>
                                                update({
                                                    values: checked
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
                            step="any"
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
                            step="any"
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

interface AttendanceItemFilterSummaryProps {
    items: AttendanceItem[];
    totalItems: number;
}

export function AttendanceItemFilterSummary({
    items,
    totalItems,
}: AttendanceItemFilterSummaryProps) {
    const totalWage = items.reduce(
        (total, item) => total + Number(item.wage || 0),
        0,
    );

    return (
        <TableRow
            aria-label="Résumé des ouvriers filtrés"
            className="h-11 border-b border-neutral-200 bg-neutral-50/70 text-sm hover:bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-800/30 dark:hover:bg-neutral-800/30"
        >
            <TableHead
                colSpan={2}
                className="font-semibold text-muted-foreground"
            >
                {items.length} / {totalItems} ouvriers affichés
            </TableHead>
            <TableHead className="text-right font-semibold text-muted-foreground">
                Total :{' '}
                <span className="font-mono text-foreground">
                    {new Intl.NumberFormat('fr-FR', {
                        maximumFractionDigits: 2,
                    }).format(totalWage)}{' '}
                    DH
                </span>
            </TableHead>
            <TableHead />
        </TableRow>
    );
}

interface AttendanceItemPaginationProps {
    totalItems: number;
    page: number;
    pageCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function AttendanceItemPagination({
    totalItems,
    page,
    pageCount,
    pageSize,
    onPageChange,
}: AttendanceItemPaginationProps) {
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50 print:hidden">
            <div className="text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                {start}–{end} sur {totalItems} ouvriers
            </div>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Page précédente"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                    (pageNumber) => (
                        <Button
                            key={pageNumber}
                            type="button"
                            variant={
                                pageNumber === page ? 'default' : 'outline'
                            }
                            size="sm"
                            aria-label={`Page ${pageNumber}`}
                            aria-current={
                                pageNumber === page ? 'page' : undefined
                            }
                            onClick={() => onPageChange(pageNumber)}
                            className={cn(
                                'h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
                                pageNumber === page &&
                                    'scale-105 shadow-md dark:bg-primary dark:text-primary-foreground',
                            )}
                        >
                            {pageNumber}
                        </Button>
                    ),
                )}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Page suivante"
                    disabled={page >= pageCount}
                    onClick={() => onPageChange(page + 1)}
                    className="h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
