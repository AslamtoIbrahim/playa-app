import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { SearchSelect } from '@/components/search-select';
import { useSaleDialog } from '@/hooks/use-sale-dialog';
import type { InvoiceItem } from '@/types/invoice-item';
import type { Sale } from '@/types/sale';
import type { Item as CatalogItem } from '@/types/item';
import { router } from '@inertiajs/react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const formatSaleNumber = (value: number): string =>
    value.toLocaleString('fr-FR', {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 3,
    });

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: InvoiceItem[];
    sales: Sale[];
    catalogItems: CatalogItem[];
    availableStockByCategory?: Record<number, number>;
}

export function SaleDialog({
    open,
    onOpenChange,
    items,
    sales,
    catalogItems,
    availableStockByCategory = {},
}: Props) {
    const {
        counts,
        defaultRealPrice,
        defaultSalePrice,
        deleteAllSavedLines,
        fillSavedSelection,
        fillSelectedCells,
        handleOpenChange,
        isBulkDeleteOpen,
        isCellInRange,
        isSavedCellInRange,
        itemIds,
        openItemIds,
        openSaleIds,
        prices,
        realPrices,
        remaining,
        saleIds,
        saleOptions,
        savedSaleRows,
        save,
        selectCellRange,
        selectSavedCellRange,
        sellableItems,
        setCounts,
        setIsBulkDeleteOpen,
        setItemIds,
        setOpenItemIds,
        setOpenSaleIds,
        setPrices,
        setRealPrices,
        setSaleIds,
        setTaxFlags,
        suppressCellClick,
        suppressSavedCellClick,
        taxFlags,
    } = useSaleDialog({
        items,
        sales,
        availableStockByCategory,
        onOpenChange,
    });

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-amber-100 p-0 shadow-2xl sm:max-w-5xl dark:border-amber-950 dark:bg-neutral-950 dark:text-neutral-100">
                    <DialogHeader className="shrink-0 border-b border-amber-100 bg-linear-to-br from-amber-50 via-white to-orange-50 p-4 pr-12 text-left dark:border-amber-950 dark:from-amber-950/50 dark:via-neutral-950 dark:to-orange-950/30">
                        <div className="flex items-center justify-between gap-3">
                            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-neutral-100">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    <ShoppingCart className="size-4" />
                                </span>
                                {'Vente \u00b7 Articles s\u00e9lectionn\u00e9s'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="sr-only">
                            Saisissez et modifiez les lignes de vente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-auto bg-slate-50/60 p-3 dark:bg-neutral-950">
                        <Table className="w-auto min-w-212.5 border-collapse">
                            <TableHeader className="sticky top-0 z-20 bg-slate-50/80 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                                <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-neutral-800">
                                    <TableHead className="min-w-40 py-4 pl-6 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        Client
                                    </TableHead>
                                    <TableHead className="min-w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        Bateau
                                    </TableHead>
                                    <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        Prix vente
                                    </TableHead>
                                    <TableHead className="min-w-32 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        Article
                                    </TableHead>
                                    <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        {'Quantit\u00e9'}
                                    </TableHead>
                                    <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        {'Prix r\u00e9el'}
                                    </TableHead>
                                    <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        Montant
                                    </TableHead>
                                    <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        Taxe 3%
                                    </TableHead>
                                    <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <span>Avec taxe</span>
                                            <Checkbox
                                                checked={
                                                    sellableItems.length > 0 &&
                                                    sellableItems.every(
                                                        (item) =>
                                                            taxFlags[
                                                                `item-${item.id}`
                                                            ] ?? false,
                                                    )
                                                }
                                                onCheckedChange={(checked) => {
                                                    const isWithTax =
                                                        checked === true;
                                                    setTaxFlags((current) => ({
                                                        ...current,
                                                        ...Object.fromEntries(
                                                            sellableItems.map(
                                                                (item) => [
                                                                    `item-${item.id}`,
                                                                    isWithTax,
                                                                ],
                                                            ),
                                                        ),
                                                    }));
                                                }}
                                                aria-label="Appliquer la taxe à tous les articles"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                        Total diff
                                    </TableHead>
                                    <TableHead className="w-12 p-0 text-center">
                                        {savedSaleRows.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-9 text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                                                onClick={() =>
                                                    setIsBulkDeleteOpen(true)
                                                }
                                                aria-label="Supprimer toutes les lignes de vente enregistrées"
                                                title="Supprimer toutes les lignes enregistrées"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sellableItems.map((item, rowIndex) => {
                                    const key = `item-${item.id}`;
                                    const count = Number(
                                        Math.min(
                                            Number(
                                                counts[key] ?? remaining(item),
                                            ),
                                            availableStockByCategory[
                                                item.category_id
                                            ] ?? remaining(item),
                                        ),
                                    );
                                    const realPrice = Number(
                                        realPrices[key] ??
                                            defaultRealPrice(item),
                                    );
                                    const salePrice = Number(
                                        prices[key] ?? defaultSalePrice(item),
                                    );
                                    const amount = count * realPrice;
                                    const isWithTax = taxFlags[key] ?? false;

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="group h-10 min-h-10 border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-neutral-800 dark:hover:bg-neutral-900/40"
                                        >
                                            <TableCell
                                                tabIndex={-1}
                                                onMouseDown={(event) =>
                                                    selectCellRange(
                                                        event,
                                                        'client',
                                                        rowIndex,
                                                    )
                                                }
                                                onClickCapture={
                                                    suppressCellClick
                                                }
                                                onKeyDown={(event) => {
                                                    if (
                                                        event.target !==
                                                        event.currentTarget
                                                    ) {
                                                        return;
                                                    }

                                                    fillSelectedCells(
                                                        event,
                                                        'client',
                                                        rowIndex,
                                                        setSaleIds,
                                                        (sourceItem) =>
                                                            saleIds[
                                                                `item-${sourceItem.id}`
                                                            ] ?? '',
                                                    );
                                                }}
                                                className={cn(
                                                    'min-w-40 border-r border-slate-100 p-0 pl-1 dark:border-neutral-800',
                                                    isCellInRange(
                                                        'client',
                                                        rowIndex,
                                                    ) &&
                                                        'bg-orange-100/90 dark:bg-orange-900/50',
                                                )}
                                            >
                                                <SearchSelect
                                                    value={saleIds[key] ?? ''}
                                                    options={saleOptions}
                                                    placeholder="Client..."
                                                    emptyMessage="Aucun client trouve."
                                                    open={
                                                        openSaleIds[key] ??
                                                        false
                                                    }
                                                    onOpenChange={(isOpen) =>
                                                        setOpenSaleIds(
                                                            (current) => ({
                                                                ...current,
                                                                [key]: isOpen,
                                                            }),
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (openSaleIds[key]) {
                                                            return;
                                                        }

                                                        fillSelectedCells(
                                                            event,
                                                            'client',
                                                            rowIndex,
                                                            setSaleIds,
                                                            (sourceItem) =>
                                                                saleIds[
                                                                    `item-${sourceItem.id}`
                                                                ] ?? '',
                                                        );

                                                        if (
                                                            event.key ===
                                                            'Enter'
                                                        ) {
                                                            event.preventDefault();
                                                            save(item);

                                                            return;
                                                        }

                                                        navigateToAdjacentCell(
                                                            event,
                                                        );
                                                    }}
                                                    onSelect={(id) =>
                                                        setSaleIds(
                                                            (current) => ({
                                                                ...current,
                                                                [key]: String(
                                                                    id,
                                                                ),
                                                            }),
                                                        )
                                                    }
                                                    className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 capitalize shadow-none focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                                />
                                            </TableCell>
                                            <TableCell className="min-w-28 border-r border-slate-100 px-3 py-0 font-medium capitalize dark:border-neutral-800">
                                                <span className="block truncate text-slate-700 dark:text-neutral-300">
                                                    {item.boat?.name ??
                                                        '\u2014'}
                                                </span>
                                            </TableCell>
                                            <TableCell
                                                tabIndex={-1}
                                                onMouseDown={(event) =>
                                                    selectCellRange(
                                                        event,
                                                        'salePrice',
                                                        rowIndex,
                                                    )
                                                }
                                                onClickCapture={
                                                    suppressCellClick
                                                }
                                                onKeyDown={(event) => {
                                                    if (
                                                        event.target !==
                                                        event.currentTarget
                                                    ) {
                                                        return;
                                                    }

                                                    fillSelectedCells(
                                                        event,
                                                        'salePrice',
                                                        rowIndex,
                                                        setPrices,
                                                        (sourceItem) =>
                                                            prices[
                                                                `item-${sourceItem.id}`
                                                            ] ??
                                                            String(
                                                                defaultSalePrice(
                                                                    sourceItem,
                                                                ),
                                                            ),
                                                    );
                                                }}
                                                className={cn(
                                                    'w-28 border-r border-slate-100 p-0 dark:border-neutral-800',
                                                    isCellInRange(
                                                        'salePrice',
                                                        rowIndex,
                                                    ) &&
                                                        'bg-orange-100/90 dark:bg-orange-900/50',
                                                )}
                                            >
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={
                                                        prices[key] ??
                                                        defaultSalePrice(item)
                                                    }
                                                    onChange={(event) =>
                                                        setPrices(
                                                            (current) => ({
                                                                ...current,
                                                                [key]: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        fillSelectedCells(
                                                            event,
                                                            'salePrice',
                                                            rowIndex,
                                                            setPrices,
                                                            (sourceItem) =>
                                                                prices[
                                                                    `item-${sourceItem.id}`
                                                                ] ??
                                                                String(
                                                                    defaultSalePrice(
                                                                        sourceItem,
                                                                    ),
                                                                ),
                                                        );

                                                        if (
                                                            event.key ===
                                                            'Enter'
                                                        ) {
                                                            event.preventDefault();
                                                            save(item);

                                                            return;
                                                        }

                                                        navigateToAdjacentCell(
                                                            event,
                                                        );
                                                    }}
                                                    className="h-10 [appearance:textfield] border-none bg-transparent text-center text-slate-900 transition-all focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    aria-label="Prix de vente"
                                                />
                                            </TableCell>
                                            <TableCell
                                                tabIndex={-1}
                                                onMouseDown={(event) =>
                                                    selectCellRange(
                                                        event,
                                                        'article',
                                                        rowIndex,
                                                    )
                                                }
                                                onClickCapture={
                                                    suppressCellClick
                                                }
                                                onKeyDown={(event) => {
                                                    if (
                                                        event.target !==
                                                        event.currentTarget
                                                    ) {
                                                        return;
                                                    }

                                                    fillSelectedCells(
                                                        event,
                                                        'article',
                                                        rowIndex,
                                                        setItemIds,
                                                        (sourceItem) =>
                                                            itemIds[
                                                                `item-${sourceItem.id}`
                                                            ] ?? '',
                                                        (
                                                            targetItem,
                                                            sourceItem,
                                                        ) => {
                                                            const sourceArticle =
                                                                catalogItems.find(
                                                                    (option) =>
                                                                        String(
                                                                            option.id,
                                                                        ) ===
                                                                        itemIds[
                                                                            `item-${sourceItem.id}`
                                                                        ],
                                                                );

                                                            return (
                                                                targetItem.category_id ===
                                                                sourceArticle?.category_id
                                                            );
                                                        },
                                                    );
                                                }}
                                                className={cn(
                                                    'min-w-32 border-r border-slate-100 p-0 dark:border-neutral-800',
                                                    isCellInRange(
                                                        'article',
                                                        rowIndex,
                                                    ) &&
                                                        'bg-orange-100/90 dark:bg-orange-900/50',
                                                )}
                                            >
                                                <SearchSelect
                                                    value={itemIds[key] ?? ''}
                                                    options={catalogItems
                                                        .filter(
                                                            (option) =>
                                                                option.category_id ===
                                                                item.category_id,
                                                        )
                                                        .map((option) => ({
                                                            id: option.id,
                                                            name: option.name,
                                                        }))}
                                                    placeholder={`${item.category?.name ?? 'Catégorie'} · Article...`}
                                                    emptyMessage="Aucun article dans cette catégorie."
                                                    open={
                                                        openItemIds[key] ??
                                                        false
                                                    }
                                                    onOpenChange={(open) =>
                                                        setOpenItemIds(
                                                            (state) => ({
                                                                ...state,
                                                                [key]: open,
                                                            }),
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (openItemIds[key]) {
                                                            return;
                                                        }

                                                        fillSelectedCells(
                                                            event,
                                                            'article',
                                                            rowIndex,
                                                            setItemIds,
                                                            (sourceItem) =>
                                                                itemIds[
                                                                    `item-${sourceItem.id}`
                                                                ] ?? '',
                                                            (
                                                                targetItem,
                                                                sourceItem,
                                                            ) => {
                                                                const sourceArticleId =
                                                                    itemIds[
                                                                        `item-${sourceItem.id}`
                                                                    ];
                                                                const sourceArticle =
                                                                    catalogItems.find(
                                                                        (
                                                                            option,
                                                                        ) =>
                                                                            String(
                                                                                option.id,
                                                                            ) ===
                                                                            sourceArticleId,
                                                                    );

                                                                return (
                                                                    targetItem.category_id ===
                                                                    sourceArticle?.category_id
                                                                );
                                                            },
                                                        );

                                                        navigateToAdjacentCell(
                                                            event,
                                                        );
                                                    }}
                                                    onSelect={(id) =>
                                                        setItemIds((state) => ({
                                                            ...state,
                                                            [key]: String(id),
                                                        }))
                                                    }
                                                    className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 capitalize shadow-none focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                                />
                                            </TableCell>
                                            <TableCell className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800">
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={Math.min(
                                                        Number(
                                                            counts[key] ??
                                                                remaining(item),
                                                        ),
                                                        availableStockByCategory[
                                                            item.category_id
                                                        ] ?? remaining(item),
                                                    )}
                                                    onChange={(event) =>
                                                        setCounts(
                                                            (current) => ({
                                                                ...current,
                                                                [key]: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key ===
                                                            'Enter'
                                                        ) {
                                                            event.preventDefault();
                                                            save(item);

                                                            return;
                                                        }

                                                        navigateToAdjacentCell(
                                                            event,
                                                        );
                                                    }}
                                                    className="h-10 [appearance:textfield] border-none bg-transparent text-center text-slate-900 transition-all focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    aria-label="Quantit\u00e9 vendue"
                                                />
                                            </TableCell>
                                            <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={
                                                        realPrices[key] ??
                                                        Number(
                                                            item
                                                                .differences?.[0]
                                                                ?.real_price ??
                                                                item.unit_price,
                                                        )
                                                    }
                                                    onChange={(event) =>
                                                        setRealPrices(
                                                            (current) => ({
                                                                ...current,
                                                                [key]: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key ===
                                                            'Enter'
                                                        ) {
                                                            event.preventDefault();
                                                            save(item);

                                                            return;
                                                        }

                                                        navigateToAdjacentCell(
                                                            event,
                                                        );
                                                    }}
                                                    className="h-10 [appearance:textfield] border-none bg-transparent text-center text-slate-900 transition-all focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    aria-label="Prix r\u00e9el"
                                                />
                                            </TableCell>
                                            <TableCell className="w-28 border-r border-slate-100 px-3 py-0 text-right text-xs font-bold text-slate-700 tabular-nums dark:border-neutral-800 dark:text-neutral-300">
                                                {formatSaleNumber(amount)}
                                            </TableCell>
                                            <TableCell className="w-20 border-r border-slate-100 px-3 py-0 text-right text-xs text-slate-600 tabular-nums dark:border-neutral-800 dark:text-neutral-400">
                                                {formatSaleNumber(
                                                    isWithTax
                                                        ? amount * 0.03
                                                        : 0,
                                                )}
                                            </TableCell>
                                            <TableCell className="w-20 border-r border-slate-100 p-0 text-center dark:border-neutral-800">
                                                <Checkbox
                                                    checked={isWithTax}
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key ===
                                                            'Enter'
                                                        ) {
                                                            event.preventDefault();
                                                            event.currentTarget.click();

                                                            return;
                                                        }

                                                        navigateToAdjacentCell(
                                                            event,
                                                        );
                                                    }}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        setTaxFlags(
                                                            (current) => ({
                                                                ...current,
                                                                [key]:
                                                                    checked ===
                                                                    true,
                                                            }),
                                                        )
                                                    }
                                                    aria-label="Vendre avec taxe"
                                                />
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'w-28 px-3 py-0 text-right text-xs font-bold tabular-nums',
                                                    (salePrice - realPrice) *
                                                        count <
                                                        0
                                                        ? 'text-rose-600 dark:text-rose-400'
                                                        : (salePrice -
                                                                realPrice) *
                                                                count >
                                                            0
                                                          ? 'text-emerald-600 dark:text-emerald-400'
                                                          : 'text-slate-600 dark:text-neutral-300',
                                                )}
                                            >
                                                {formatSaleNumber(
                                                    (salePrice - realPrice) *
                                                        count,
                                                )}
                                            </TableCell>
                                            <TableCell className="w-12" />
                                        </TableRow>
                                    );
                                })}
                                {savedSaleRows.map(
                                    ({ item, line }, rowIndex) => {
                                        const key = `sale-${line.id}`;
                                        const quantity =
                                            counts[key] ??
                                            String(
                                                Math.abs(
                                                    Number(line.unit_count),
                                                ),
                                            );

                                        return (
                                            <TableRow
                                                key={key}
                                                className="group h-10 border-b border-slate-100 dark:border-neutral-800"
                                            >
                                                <TableCell
                                                    tabIndex={-1}
                                                    onMouseDown={(event) =>
                                                        selectSavedCellRange(
                                                            event,
                                                            'client',
                                                            rowIndex,
                                                        )
                                                    }
                                                    onClickCapture={
                                                        suppressSavedCellClick
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.target ===
                                                            event.currentTarget
                                                        ) {
                                                            fillSavedSelection(
                                                                event,
                                                                'client',
                                                                rowIndex,
                                                                setSaleIds,
                                                                (
                                                                    _sourceItem,
                                                                    sourceIndex,
                                                                ) => {
                                                                    const sourceLine =
                                                                        savedSaleRows[
                                                                            sourceIndex
                                                                        ].line;

                                                                    return (
                                                                        saleIds[
                                                                            `sale-${sourceLine.id}`
                                                                        ] ??
                                                                        String(
                                                                            sourceLine.sale_id,
                                                                        )
                                                                    );
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className={cn(
                                                        'min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800',
                                                        isSavedCellInRange(
                                                            'client',
                                                            rowIndex,
                                                        ) &&
                                                            'bg-orange-100/90 dark:bg-orange-900/50',
                                                    )}
                                                >
                                                    <SearchSelect
                                                        value={
                                                            saleIds[key] ??
                                                            String(line.sale_id)
                                                        }
                                                        options={saleOptions}
                                                        placeholder="Client..."
                                                        emptyMessage="Aucun client trouvé."
                                                        open={
                                                            openSaleIds[key] ??
                                                            false
                                                        }
                                                        onOpenChange={(open) =>
                                                            setOpenSaleIds(
                                                                (state) => ({
                                                                    ...state,
                                                                    [key]: open,
                                                                }),
                                                            )
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                openSaleIds[key]
                                                            ) {
                                                                return;
                                                            }

                                                            fillSavedSelection(
                                                                event,
                                                                'client',
                                                                rowIndex,
                                                                setSaleIds,
                                                                (
                                                                    _sourceItem,
                                                                    sourceIndex,
                                                                ) => {
                                                                    const sourceLine =
                                                                        savedSaleRows[
                                                                            sourceIndex
                                                                        ].line;

                                                                    return (
                                                                        saleIds[
                                                                            `sale-${sourceLine.id}`
                                                                        ] ??
                                                                        String(
                                                                            sourceLine.sale_id,
                                                                        )
                                                                    );
                                                                },
                                                            );

                                                            navigateToAdjacentCell(
                                                                event,
                                                            );
                                                        }}
                                                        onSelect={(id) => {
                                                            const selectedId =
                                                                Number(id);
                                                            setSaleIds(
                                                                (state) => ({
                                                                    ...state,
                                                                    [key]: String(
                                                                        selectedId,
                                                                    ),
                                                                }),
                                                            );
                                                            save(
                                                                item,
                                                                line,
                                                                selectedId,
                                                            );
                                                        }}
                                                        className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 capitalize shadow-none focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                                    />
                                                </TableCell>
                                                <TableCell className="min-w-28 border-r border-slate-100 px-3 dark:border-neutral-800">
                                                    {item.boat?.name ?? '—'}
                                                </TableCell>
                                                <TableCell
                                                    tabIndex={-1}
                                                    onMouseDown={(event) =>
                                                        selectSavedCellRange(
                                                            event,
                                                            'salePrice',
                                                            rowIndex,
                                                        )
                                                    }
                                                    onClickCapture={
                                                        suppressSavedCellClick
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.target ===
                                                            event.currentTarget
                                                        ) {
                                                            fillSavedSelection(
                                                                event,
                                                                'salePrice',
                                                                rowIndex,
                                                                setPrices,
                                                                (
                                                                    _sourceItem,
                                                                    sourceIndex,
                                                                ) => {
                                                                    const sourceLine =
                                                                        savedSaleRows[
                                                                            sourceIndex
                                                                        ].line;

                                                                    return (
                                                                        prices[
                                                                            `sale-${sourceLine.id}`
                                                                        ] ??
                                                                        String(
                                                                            sourceLine.sale_price,
                                                                        )
                                                                    );
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className={cn(
                                                        'w-28 border-r border-slate-100 p-0 dark:border-neutral-800',
                                                        isSavedCellInRange(
                                                            'salePrice',
                                                            rowIndex,
                                                        ) &&
                                                            'bg-orange-100/90 dark:bg-orange-900/50',
                                                    )}
                                                >
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={
                                                            prices[key] ??
                                                            Number(
                                                                line.sale_price,
                                                            )
                                                        }
                                                        onChange={(event) =>
                                                            setPrices(
                                                                (state) => ({
                                                                    ...state,
                                                                    [key]: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            save(item, line)
                                                        }
                                                        onKeyDown={(event) => {
                                                            fillSavedSelection(
                                                                event,
                                                                'salePrice',
                                                                rowIndex,
                                                                setPrices,
                                                                (
                                                                    _sourceItem,
                                                                    sourceIndex,
                                                                ) => {
                                                                    const sourceLine =
                                                                        savedSaleRows[
                                                                            sourceIndex
                                                                        ].line;

                                                                    return (
                                                                        prices[
                                                                            `sale-${sourceLine.id}`
                                                                        ] ??
                                                                        String(
                                                                            sourceLine.sale_price,
                                                                        )
                                                                    );
                                                                },
                                                            );
                                                            navigateToAdjacentCell(
                                                                event,
                                                            );
                                                        }}
                                                        className="h-10 [appearance:textfield] border-none bg-transparent text-center focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        aria-label="Prix de vente"
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    tabIndex={-1}
                                                    onMouseDown={(event) =>
                                                        selectSavedCellRange(
                                                            event,
                                                            'article',
                                                            rowIndex,
                                                        )
                                                    }
                                                    onClickCapture={
                                                        suppressSavedCellClick
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.target ===
                                                            event.currentTarget
                                                        ) {
                                                            fillSavedSelection(
                                                                event,
                                                                'article',
                                                                rowIndex,
                                                                setItemIds,
                                                                (
                                                                    _sourceItem,
                                                                    sourceIndex,
                                                                ) => {
                                                                    const sourceLine =
                                                                        savedSaleRows[
                                                                            sourceIndex
                                                                        ].line;

                                                                    return (
                                                                        itemIds[
                                                                            `sale-${sourceLine.id}`
                                                                        ] ??
                                                                        String(
                                                                            sourceLine.item_id,
                                                                        )
                                                                    );
                                                                },
                                                                (
                                                                    targetItem,
                                                                    sourceItem,
                                                                    targetIndex,
                                                                    sourceIndex,
                                                                ) => {
                                                                    const sourceLine =
                                                                        savedSaleRows[
                                                                            sourceIndex
                                                                        ].line;
                                                                    const sourceArticleId =
                                                                        itemIds[
                                                                            `sale-${sourceLine.id}`
                                                                        ] ??
                                                                        String(
                                                                            sourceLine.item_id,
                                                                        );
                                                                    const sourceArticle =
                                                                        catalogItems.find(
                                                                            (
                                                                                option,
                                                                            ) =>
                                                                                String(
                                                                                    option.id,
                                                                                ) ===
                                                                                sourceArticleId,
                                                                        );

                                                                    return (
                                                                        targetItem.category_id ===
                                                                            sourceArticle?.category_id &&
                                                                        savedSaleRows[
                                                                            targetIndex
                                                                        ].item
                                                                            .category_id ===
                                                                            savedSaleRows[
                                                                                sourceIndex
                                                                            ]
                                                                                .item
                                                                                .category_id
                                                                    );
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className={cn(
                                                        'min-w-32 border-r border-slate-100 p-0 dark:border-neutral-800',
                                                        isSavedCellInRange(
                                                            'article',
                                                            rowIndex,
                                                        ) &&
                                                            'bg-orange-100/90 dark:bg-orange-900/50',
                                                    )}
                                                >
                                                    <SearchSelect
                                                        value={
                                                            itemIds[key] ??
                                                            String(line.item_id)
                                                        }
                                                        options={catalogItems
                                                            .filter(
                                                                (option) =>
                                                                    option.category_id ===
                                                                    item.category_id,
                                                            )
                                                            .map((option) => ({
                                                                id: option.id,
                                                                name: option.name,
                                                            }))}
                                                        placeholder="Article..."
                                                        emptyMessage="Aucun article trouvé."
                                                        open={
                                                            openItemIds[key] ??
                                                            false
                                                        }
                                                        onOpenChange={(open) =>
                                                            setOpenItemIds(
                                                                (state) => ({
                                                                    ...state,
                                                                    [key]: open,
                                                                }),
                                                            )
                                                        }
                                                        onKeyDown={(event) => {
                                                            fillSavedSelection(
                                                                event,
                                                                'article',
                                                                rowIndex,
                                                                setItemIds,
                                                                (
                                                                    _sourceItem,
                                                                    sourceIndex,
                                                                ) => {
                                                                    const sourceLine =
                                                                        savedSaleRows[
                                                                            sourceIndex
                                                                        ].line;

                                                                    return (
                                                                        itemIds[
                                                                            `sale-${sourceLine.id}`
                                                                        ] ??
                                                                        String(
                                                                            sourceLine.item_id,
                                                                        )
                                                                    );
                                                                },
                                                                (
                                                                    targetItem,
                                                                    sourceItem,
                                                                    targetIndex,
                                                                    sourceIndex,
                                                                ) => {
                                                                    const sourceLine =
                                                                        savedSaleRows[
                                                                            sourceIndex
                                                                        ].line;
                                                                    const sourceArticleId =
                                                                        itemIds[
                                                                            `sale-${sourceLine.id}`
                                                                        ] ??
                                                                        String(
                                                                            sourceLine.item_id,
                                                                        );
                                                                    const sourceArticle =
                                                                        catalogItems.find(
                                                                            (
                                                                                option,
                                                                            ) =>
                                                                                String(
                                                                                    option.id,
                                                                                ) ===
                                                                                sourceArticleId,
                                                                        );

                                                                    return (
                                                                        targetItem.category_id ===
                                                                            sourceArticle?.category_id &&
                                                                        savedSaleRows[
                                                                            targetIndex
                                                                        ].item
                                                                            .category_id ===
                                                                            savedSaleRows[
                                                                                sourceIndex
                                                                            ]
                                                                                .item
                                                                                .category_id
                                                                    );
                                                                },
                                                            );
                                                            navigateToAdjacentCell(
                                                                event,
                                                            );
                                                        }}
                                                        onSelect={(id) => {
                                                            const selectedId =
                                                                Number(id);
                                                            setItemIds(
                                                                (state) => ({
                                                                    ...state,
                                                                    [key]: String(
                                                                        selectedId,
                                                                    ),
                                                                }),
                                                            );
                                                            save(
                                                                item,
                                                                line,
                                                                undefined,
                                                                selectedId,
                                                            );
                                                        }}
                                                        className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 capitalize shadow-none focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                                    />
                                                </TableCell>
                                                <TableCell className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={quantity}
                                                        onChange={(event) =>
                                                            setCounts(
                                                                (state) => ({
                                                                    ...state,
                                                                    [key]: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            save(item, line)
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                'Enter'
                                                            ) {
                                                                event.preventDefault();
                                                                save(
                                                                    item,
                                                                    line,
                                                                );
                                                            } else {
                                                                navigateToAdjacentCell(
                                                                    event,
                                                                );
                                                            }
                                                        }}
                                                        className="h-10 [appearance:textfield] border-none bg-transparent text-center focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        aria-label="Quantité vendue"
                                                    />
                                                </TableCell>
                                                <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={
                                                            realPrices[key] ??
                                                            Number(
                                                                line.real_price,
                                                            )
                                                        }
                                                        onChange={(event) =>
                                                            setRealPrices(
                                                                (state) => ({
                                                                    ...state,
                                                                    [key]: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            save(item, line)
                                                        }
                                                        onKeyDown={
                                                            navigateToAdjacentCell
                                                        }
                                                        className="h-10 [appearance:textfield] border-none bg-transparent text-center focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        aria-label="Prix réel"
                                                    />
                                                </TableCell>
                                                <TableCell className="w-28 border-r border-slate-100 px-3 text-right dark:border-neutral-800">
                                                    {formatSaleNumber(
                                                        Math.abs(
                                                            Number(line.amount),
                                                        ),
                                                    )}
                                                </TableCell>
                                                <TableCell className="w-20 border-r border-slate-100 px-3 text-right dark:border-neutral-800">
                                                    {formatSaleNumber(
                                                        Math.abs(
                                                            Number(line.tax),
                                                        ),
                                                    )}
                                                </TableCell>
                                                <TableCell className="w-20 border-r border-slate-100 text-center dark:border-neutral-800">
                                                    <Checkbox
                                                        checked={
                                                            taxFlags[key] ??
                                                            line.is_with_tax
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                'Enter'
                                                            ) {
                                                                event.preventDefault();
                                                                event.currentTarget.click();

                                                                return;
                                                            }

                                                            navigateToAdjacentCell(
                                                                event,
                                                            );
                                                        }}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) => {
                                                            const isWithTax =
                                                                checked ===
                                                                true;
                                                            setTaxFlags(
                                                                (state) => ({
                                                                    ...state,
                                                                    [key]: isWithTax,
                                                                }),
                                                            );
                                                            router.patch(
                                                                `/sale-items/${line.id}`,
                                                                {
                                                                    is_with_tax:
                                                                        isWithTax,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }}
                                                        aria-label="Vendre avec taxe"
                                                    />
                                                </TableCell>
                                                <TableCell className="w-28 px-3 text-right">
                                                    {formatSaleNumber(
                                                        Number(
                                                            line.total_diff ??
                                                                0,
                                                        ),
                                                    )}
                                                </TableCell>
                                                <TableCell className="w-12 p-0 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-10 text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                                                        aria-label="Supprimer la ligne de vente"
                                                        onClick={() => {
                                                            router.delete(
                                                                `/sale-items/${line.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () =>
                                                                            toast.success(
                                                                                'Ligne de vente supprimée.',
                                                                            ),
                                                                    onError:
                                                                        () =>
                                                                            toast.error(
                                                                                'Impossible de supprimer cette ligne.',
                                                                            ),
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    },
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={isBulkDeleteOpen}
                onOpenChange={setIsBulkDeleteOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer toutes les lignes enregistrées ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement les{' '}
                            {savedSaleRows.length} lignes de vente enregistrées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteAllSavedLines}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default SaleDialog;
