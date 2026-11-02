import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type {
    CautionFilterColumn,
    CautionFilters,
} from '@/hooks/use-caution-filters';
import { cn } from '@/lib/utils';
import { Filter, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface CautionSearchProps {
    value: string;
    onChange: (value: string) => void;
    showColumnFilters: boolean;
    activeFilterCount: number;
    onToggleColumnFilters: () => void;
    onClearFilters: () => void;
}

export function CautionSearch({
    value,
    onChange,
    showColumnFilters,
    activeFilterCount,
    onToggleColumnFilters,
    onClearFilters,
}: CautionSearchProps) {
    return (
        <div className="flex w-full max-w-sm items-center gap-2">
            <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Rechercher dans toutes les colonnes…"
                    aria-label="Rechercher dans toutes les colonnes"
                    className="h-9 rounded-full border-border/70 bg-background/80 pr-9 pl-9 shadow-sm"
                />
                {value && (
                    <button
                        type="button"
                        aria-label="Effacer la recherche"
                        onClick={() => onChange('')}
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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
                onClick={() => {
                    onClearFilters();
                    onToggleColumnFilters();
                }}
                className={cn(
                    'relative size-9 shrink-0 rounded-full',
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

interface CautionColumnFilterProps {
    column: CautionFilterColumn;
    title: string;
    options?: string[];
    filters: CautionFilters;
    setFilters: Dispatch<SetStateAction<CautionFilters>>;
}

export function CautionColumnFilter({
    column,
    title,
    options,
    filters,
    setFilters,
}: CautionColumnFilterProps) {
    const [optionSearch, setOptionSearch] = useState('');
    const value = filters.columns[column];
    const active = Boolean(
        value && (value.values?.length || value.min || value.max),
    );
    const normalizedOptionSearch = optionSearch.trim().toLocaleLowerCase('fr');
    const filteredOptions = options?.filter((option) =>
        option.toLocaleLowerCase('fr').includes(normalizedOptionSearch),
    );

    const update = (next: { values?: string[]; min?: string; max?: string }) =>
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
                        'ml-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
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
                                                    min: '',
                                                    max: '',
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
                            type={column === 'created_at' ? 'date' : 'number'}
                            aria-label={
                                column === 'created_at'
                                    ? 'Date de début'
                                    : `${title} minimum`
                            }
                            placeholder={
                                column === 'created_at' ? undefined : 'Minimum'
                            }
                            value={value?.min ?? ''}
                            onChange={(event) =>
                                update({
                                    values: [],
                                    min: event.target.value,
                                    max: value?.max ?? '',
                                })
                            }
                            className="h-9 min-w-0"
                        />
                        <Input
                            type={column === 'created_at' ? 'date' : 'number'}
                            aria-label={
                                column === 'created_at'
                                    ? 'Date de fin'
                                    : `${title} maximum`
                            }
                            placeholder={
                                column === 'created_at' ? undefined : 'Maximum'
                            }
                            value={value?.max ?? ''}
                            onChange={(event) =>
                                update({
                                    values: [],
                                    min: value?.min ?? '',
                                    max: event.target.value,
                                })
                            }
                            className="h-9 min-w-0"
                        />
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
