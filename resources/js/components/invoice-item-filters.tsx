import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    InvoiceItemFilterColumn,
    InvoiceItemFilters as Filters,
} from '@/hooks/use-invoice-item-filters';
import { cn } from '@/lib/utils';
import { computeInvoiceItemDifferenceTotal } from '@/lib/differences';
import { InvoiceItem } from '@/types/invoice-item';
import { Filter, Search, X } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { TableHead, TableRow } from '@/components/ui/table';

interface GlobalSearchProps {
    value: string;
    onChange: (value: string) => void;
    showColumnFilters: boolean;
    activeFilterCount: number;
    onToggleColumnFilters: () => void;
}

export function InvoiceGlobalSearch({
    value,
    onChange,
    showColumnFilters,
    activeFilterCount,
    onToggleColumnFilters,
}: GlobalSearchProps) {
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

interface InvoiceColumnTotalsProps {
    items: InvoiceItem[];
    visible: boolean;
}

const formatTotal = (value: number) =>
    value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

export function InvoiceColumnTotals({
    items,
    visible,
}: InvoiceColumnTotalsProps) {
    if (!visible) {
        return null;
    }

    const totals = items.reduce(
        (result, item) => ({
            quantity: result.quantity + Number(item.unit_count || 0),
            price: result.price + Number(item.unit_price || 0),
            weight: result.weight + Number(item.weight || 0),
            boxes: result.boxes + Number(item.box || 0),
            amount: result.amount + Number(item.amount || 0),
            difference:
                result.difference + computeInvoiceItemDifferenceTotal(item),
        }),
        {
            quantity: 0,
            price: 0,
            weight: 0,
            boxes: 0,
            amount: 0,
            difference: 0,
        },
    );
    const boatCount = new Set(
        items.map((item) => item.boat?.name).filter(Boolean),
    ).size;
    const categoryCount = new Set(
        items.map((item) => item.category?.name).filter(Boolean),
    ).size;

    return (
        <TableRow
            aria-label="Totaux des lignes affichées"
            className="h-9 border-b border-border/50 bg-primary/[0.035] hover:bg-primary/[0.035]"
        >
            <TableHead colSpan={2} />
            <TableHead className="text-center">
                <span
                    aria-label={`${boatCount} bateaux`}
                    className="inline-flex min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums ring-1 ring-primary/15"
                >
                    {boatCount}
                </span>
            </TableHead>
            <TableHead className="text-center">
                <span
                    aria-label={`${categoryCount} catégories`}
                    className="inline-flex min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums ring-1 ring-primary/15"
                >
                    {categoryCount}
                </span>
            </TableHead>
            <TableHead className="text-center text-xs font-semibold text-foreground tabular-nums">
                {formatTotal(totals.quantity)}
            </TableHead>
            <TableHead className="text-right text-xs font-semibold text-foreground tabular-nums">
                {formatTotal(totals.price)}
            </TableHead>
            <TableHead />
            <TableHead className="text-center text-xs font-semibold text-foreground tabular-nums">
                {formatTotal(totals.weight)}
            </TableHead>
            <TableHead className="text-center text-xs font-semibold text-foreground tabular-nums">
                {formatTotal(totals.boxes)}
            </TableHead>
            <TableHead className="px-6 text-right text-xs font-semibold text-foreground tabular-nums">
                {formatTotal(totals.amount)}
            </TableHead>
            <TableHead className="border-l border-slate-100 px-4 text-right text-xs font-semibold text-foreground tabular-nums dark:border-neutral-800">
                {formatTotal(totals.difference)}
            </TableHead>
            <TableHead className="border-l border-slate-100 dark:border-neutral-800" />
            <TableHead />
        </TableRow>
    );
}

interface ColumnFilterProps {
    column: InvoiceItemFilterColumn;
    title: string;
    options?: string[];
    filters: Filters;
    setFilters: Dispatch<SetStateAction<Filters>>;
}

export function InvoiceColumnFilter({
    column,
    title,
    options,
    filters,
    setFilters,
}: ColumnFilterProps) {
    const value = filters.columns[column];
    const active = Boolean(
        value && ((value.values?.length ?? 0) > 0 || value.min || value.max),
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
                    <Filter className="size-3.5" />
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
                    <div className="max-h-52 space-y-1 overflow-y-auto">
                        {options.map((option) => {
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
                                                          value?.values ?? []
                                                      ).filter(
                                                          (entry) =>
                                                              entry !== option,
                                                      ),
                                                min: value?.min ?? '',
                                                max: value?.max ?? '',
                                            })
                                        }
                                    />
                                    <span className="truncate">{option}</span>
                                </label>
                            );
                        })}
                        {options.length === 0 && (
                            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                                Aucune valeur disponible
                            </p>
                        )}
                    </div>
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
