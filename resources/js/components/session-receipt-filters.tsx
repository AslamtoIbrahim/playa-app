import { Filter, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { TableHead, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Receipt } from '@/types/receipt';

export type SessionReceiptFilterColumn =
    | 'number'
    | 'supplier'
    | 'amount'
    | 'remaining';

export interface SessionReceiptColumnFilterValue {
    values?: string[];
    min?: string;
    max?: string;
}

export interface SessionReceiptFilters {
    search: string;
    columns: Partial<
        Record<SessionReceiptFilterColumn, SessionReceiptColumnFilterValue>
    >;
}

interface SessionReceiptSearchProps {
    value: string;
    onChange: (value: string) => void;
    showColumnFilters: boolean;
    activeFilterCount: number;
    onToggleColumnFilters: () => void;
}

export function SessionReceiptSearch({
    value,
    onChange,
    showColumnFilters,
    activeFilterCount,
    onToggleColumnFilters,
}: SessionReceiptSearchProps) {
    return (
        <div className="flex w-full max-w-sm items-center gap-2 print:hidden">
            <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Rechercher un bon…"
                    aria-label="Rechercher un bon"
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

interface SessionReceiptColumnFilterProps {
    title: string;
    options?: string[];
    value?: SessionReceiptColumnFilterValue;
    onChange: (value: SessionReceiptColumnFilterValue) => void;
}

export function SessionReceiptColumnFilter({
    title,
    options,
    value,
    onChange,
}: SessionReceiptColumnFilterProps) {
    const active = Boolean(
        value && ((value.values?.length ?? 0) > 0 || value.min || value.max),
    );

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
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                                onChange({ values: [], min: '', max: '' })
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
                                            onChange({
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
                                onChange({
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
                                onChange({
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

interface SessionReceiptColumnTotalsProps {
    receipts: Receipt[];
    getRemainingAmount: (receipt: Receipt) => number;
    formatCurrency: (amount: number) => string;
}

export function SessionReceiptColumnTotals({
    receipts,
    getRemainingAmount,
    formatCurrency,
}: SessionReceiptColumnTotalsProps) {
    const totals = receipts.reduce(
        (result, receipt) => ({
            amount: result.amount + Number(receipt.total_amount || 0),
            remaining: result.remaining + getRemainingAmount(receipt),
        }),
        { amount: 0, remaining: 0 },
    );

    return (
        <TableRow
            aria-label="Totaux des bons affichés"
            className="h-11 border-b border-slate-200/80 bg-linear-to-r from-white via-slate-50 to-white hover:from-white hover:via-slate-50 hover:to-white dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900/60 dark:to-neutral-900 dark:hover:from-neutral-900 dark:hover:via-neutral-900/60 dark:hover:to-neutral-900"
        >
            <TableHead colSpan={2} className="pl-4">
                <span className="text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                    Totaux ({receipts.length} bon
                    {receipts.length === 1 ? '' : 's'})
                </span>
            </TableHead>
            <TableHead className="text-right">
                <TotalBadge
                    value={totals.amount}
                    formatValue={formatCurrency}
                />
            </TableHead>
            <TableHead className="text-right">
                <TotalBadge
                    value={totals.remaining}
                    formatValue={formatCurrency}
                />
            </TableHead>
            <TableHead />
        </TableRow>
    );
}

function TotalBadge({
    value,
    formatValue,
}: {
    value: number;
    formatValue: (value: number) => string;
}) {
    return (
        <span className="inline-flex min-w-14 items-center justify-center rounded-lg bg-white px-2.5 py-0.5 text-xs font-bold tracking-tight text-blue-700 tabular-nums shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-800 dark:text-blue-300 dark:ring-neutral-700">
            {formatValue(value)}
        </span>
    );
}
