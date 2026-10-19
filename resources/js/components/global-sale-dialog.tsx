import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SearchSelect } from '@/components/search-select';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/types/category';
import type { Item } from '@/types/item';
import type { Sale } from '@/types/sale';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useGlobalSaleDialog } from '@/hooks/use-global-sale-dialog';
import type { KeyboardEvent } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale?: Sale;
    sales?: Sale[];
    items: Item[];
    invoiceCatalogItems: Item[];
    categories: Category[];
    invoiceCategoryIds: number[];
    categoryUnitById: Record<number, string>;
    availableStockByCategory?: Record<number, number>;
}

const categoryBadgeColors = [
    'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
    'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
    'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200',
    'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200',
    'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200',
    'border-pink-300 bg-pink-50 text-pink-800 dark:border-pink-800 dark:bg-pink-950/50 dark:text-pink-200',
];

const remainingCountFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
});

const numberInputValue = (value: number | string): string => {
    const number = Number(value);

    return Number.isFinite(number) ? String(number) : '';
};

const handleSavedRowKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();

        return;
    }

    navigateToAdjacentCell(event);
};

export function GlobalSaleDialog({
    open,
    onOpenChange,
    sale,
    sales = [],
    items,
    invoiceCatalogItems,
    categories,
    invoiceCategoryIds,
    categoryUnitById,
    availableStockByCategory = {},
}: Props) {
    const {
        amount,
        articleIds,
        boatlessSaleItems,
        deleteSaleItem,
        draft,
        handleCellKeyDown,
        handleDialogOpenChange,
        invoiceCategoryStock,
        itemSelectOpen,
        openArticleIds,
        openClientIds,
        remainingInvoiceCount,
        saleSelectOpen,
        selectedSale,
        selectedSaleId,
        setArticleIds,
        setItemSelectOpen,
        setOpenArticleIds,
        setOpenClientIds,
        setSaleSelectOpen,
        setSelectedSaleId,
        tax,
        totalDiff,
        updateDraft,
        updateSaleItem,
    } = useGlobalSaleDialog({
        onOpenChange,
        sale,
        sales,
        items,
        categories,
        invoiceCategoryIds,
        categoryUnitById,
        availableStockByCategory,
    });

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="flex max-h-[88vh] w-11/12 max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-amber-100 p-0 shadow-2xl sm:max-w-5xl dark:border-amber-950 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 border-b border-amber-200 bg-linear-to-br from-amber-50 via-white to-yellow-50 p-3 pr-12 text-left dark:border-amber-950 dark:from-amber-950/50 dark:via-neutral-950 dark:to-yellow-950/30">
                    <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 truncate pt-1 text-[10px] font-bold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-300">
                            {'Vente \u00b7 '}
                            {selectedSale?.customer?.name ?? (selectedSale ? `Vente #${selectedSale.id}` : 'Choisissez une vente')}
                        </div>
                        {invoiceCategoryStock.length > 0 && (
                            <div
                                aria-label="Stock restant par catégorie"
                                role="group"
                                className="flex max-w-2/3 shrink-0 flex-wrap justify-end gap-1"
                            >
                                {invoiceCategoryStock.map((category) => (
                                    <Badge
                                        key={category.id}
                                        variant="outline"
                                        className={cn(
                                            'h-6 gap-1 px-1.5 text-[10px] font-medium shadow-sm',
                                            category.remaining <= 0
                                                ? 'animate-pulse border-red-400 bg-red-50 text-red-700 motion-reduce:animate-none dark:border-red-700 dark:bg-red-950/60 dark:text-red-300'
                                                : categoryBadgeColors[
                                                      category.id %
                                                          categoryBadgeColors.length
                                                  ],
                                        )}
                                    >
                                        <span className="max-w-24 truncate">
                                            {category.name}:
                                        </span>
                                        <span className="font-bold tabular-nums">
                                            {remainingCountFormatter.format(category.remaining)}{' '}
                                            {category.unit}
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-neutral-100">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20"><ShoppingCart className="size-4" /></span>
                        Vente globale · Articles avec ou sans bateau
                    </DialogTitle>
                    <DialogDescription className="pl-12 text-xs text-slate-500 dark:text-neutral-400">
                        Règle : la quantité vendue ne doit pas dépasser le stock restant de cette catégorie pour la journée.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-auto bg-slate-50/60 p-3 dark:bg-neutral-950">
                    <Table className="w-auto min-w-212.5 border-collapse">
                        <TableHeader className="sticky top-0 z-20 bg-slate-50/80 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="min-w-40 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Prix vente
                                </TableHead>
                                <TableHead className="min-w-40 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
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
                                    Avec taxe
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Total diff
                                </TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="group h-10 min-h-10 border-b border-amber-200 bg-amber-50/70 transition-colors hover:bg-amber-100/70 dark:border-amber-900 dark:bg-amber-950/30 dark:hover:bg-amber-950/50">
                                <TableCell className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    {sale ? (
                                        <span className="block truncate px-3 font-medium text-slate-900 dark:text-neutral-100">
                                            {sale.customer?.name ?? `Vente #${sale.id}`}
                                        </span>
                                    ) : (
                                        <SearchSelect
                                            value={selectedSaleId}
                                            options={sales.map((option) => ({
                                                id: option.id,
                                                name: option.customer?.name ?? `Vente #${option.id}`,
                                            }))}
                                            placeholder="Client..."
                                            emptyMessage="Aucun client trouvé."
                                            open={saleSelectOpen}
                                            onOpenChange={setSaleSelectOpen}
                                            onSelect={(id) => setSelectedSaleId(String(id))}
                                            onKeyDown={handleCellKeyDown}
                                            className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    <Input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        value={draft.salePrice}
                                        placeholder="0"
                                        onChange={(event) => updateDraft({ salePrice: event.target.value })}
                                        onKeyDown={handleCellKeyDown}
                                        className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        aria-label="Prix de vente"
                                    />
                                </TableCell>
                                <TableCell className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    <SearchSelect
                                        value={draft.itemId}
                                        options={invoiceCatalogItems.map((item) => ({
                                            id: item.id,
                                            name: item.name,
                                        }))}
                                        placeholder="Article…"
                                        emptyMessage="Aucun article trouvé."
                                        open={itemSelectOpen}
                                        onOpenChange={setItemSelectOpen}
                                        onSelect={(id) =>
                                            updateDraft({
                                                itemId: String(id),
                                            })
                                        }
                                        onKeyDown={handleCellKeyDown}
                                        className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                    />
                                </TableCell>
                                <TableCell className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={draft.unitCount}
                                        placeholder="0"
                                        max={remainingInvoiceCount}
                                        onChange={(event) =>
                                            updateDraft({
                                                unitCount: event.target.value,
                                            })
                                        }
                                        onKeyDown={handleCellKeyDown}
                                        className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        aria-label="Quantit\u00e9 vendue"
                                    />
                                </TableCell>
                                <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    <Input
                                        type="number"
                                        step="any"
                                        value={draft.realPrice}
                                        placeholder="0"
                                        onChange={(event) =>
                                            updateDraft({
                                                realPrice: event.target.value,
                                            })
                                        }
                                        onKeyDown={handleCellKeyDown}
                                        className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        aria-label="Prix r\u00e9el"
                                    />
                                </TableCell>
                                <TableCell className="w-28 border-r border-slate-100 px-3 py-0 text-right text-xs font-bold tabular-nums text-slate-700 dark:border-neutral-800 dark:text-neutral-300">
                                    {amount.toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="w-20 border-r border-slate-100 px-3 py-0 text-right text-xs tabular-nums text-slate-600 dark:border-neutral-800 dark:text-neutral-400">
                                    {tax.toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="w-20 border-r border-slate-100 text-center dark:border-neutral-800">
                                    <Checkbox
                                        checked={draft.isWithTax}
                                        onCheckedChange={(checked) =>
                                            updateDraft({ isWithTax: checked === true })
                                        }
                                        aria-label="Vendre avec taxe"
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                event.currentTarget.click();

                                                return;
                                            }

                                            navigateToAdjacentCell(event);
                                        }}
                                    />
                                </TableCell>
                                <TableCell className={cn('w-28 px-3 py-0 text-right text-xs font-bold tabular-nums', totalDiff < 0 ? 'text-rose-600 dark:text-rose-400' : totalDiff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-neutral-300')}>
                                    {totalDiff.toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="w-12" />
                            </TableRow>
                            {boatlessSaleItems.map((line) => (
                                <TableRow key={line.id} className="group h-10 border-b border-slate-100 dark:border-neutral-800">
                                    <TableCell className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        <SearchSelect value={String(line.sale_id)} options={sales.map((option) => ({ id: option.id, name: option.customer?.name ?? `Vente #${option.id}` }))} placeholder="Client..." emptyMessage="Aucun client trouvé." open={openClientIds[String(line.id)] ?? false} onOpenChange={(open) => setOpenClientIds((state) => ({ ...state, [String(line.id)]: open }))} onKeyDown={handleCellKeyDown} onSelect={(id) => updateSaleItem(line, { sale_id: Number(id) })} className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800" />
                                    </TableCell>
                                    <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            defaultValue={numberInputValue(line.sale_price)}
                                            onBlur={(event) => {
                                                const price = Number(event.target.value);

                                                if (price > 0) {
                                                    updateSaleItem(line, {
                                                        sale_price: price,
                                                    });
                                                }
                                            }}
                                            onKeyDown={handleSavedRowKeyDown}
                                            className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            aria-label="Prix de vente"
                                        />
                                    </TableCell>
                                    <TableCell className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        <SearchSelect
                                            value={articleIds[String(line.id)] ?? String(line.item_id)}
                                            options={items.map((item) => ({ id: item.id, name: item.name }))}
                                            placeholder="Article..."
                                            emptyMessage="Aucun article trouvé."
                                            open={openArticleIds[String(line.id)] ?? false}
                                            onOpenChange={(open) => setOpenArticleIds((state) => ({ ...state, [String(line.id)]: open }))}
                                            onKeyDown={handleCellKeyDown}
                                            onSelect={(id) => {
                                                const itemId = Number(id);
                                                setArticleIds((state) => ({ ...state, [String(line.id)]: String(itemId) }));
                                                updateSaleItem(line, { item_id: itemId });
                                            }}
                                            className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                        />
                                    </TableCell>
                                    <TableCell className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            defaultValue={numberInputValue(Math.abs(Number(line.unit_count)))}
                                            onBlur={(event) => {
                                                const count = Number(event.target.value);

                                                if (count > 0) {
                                                    updateSaleItem(line, {
                                                        unit_count: -count,
                                                    });
                                                }
                                            }}
                                            onKeyDown={handleSavedRowKeyDown}
                                            className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            aria-label="Quantité vendue"
                                        />
                                    </TableCell>
                                    <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            defaultValue={numberInputValue(line.real_price)}
                                            onBlur={(event) => {
                                                updateSaleItem(line, {
                                                    real_price: Number(event.target.value),
                                                });
                                            }}
                                            onKeyDown={handleSavedRowKeyDown}
                                            className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            aria-label="Prix réel"
                                        />
                                    </TableCell>
                                    <TableCell className="w-28 border-r border-slate-100 px-3 text-right dark:border-neutral-800">
                                        {Math.abs(Number(line.amount)).toLocaleString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="w-20 border-r border-slate-100 px-3 text-right dark:border-neutral-800">
                                        {Math.abs(Number(line.tax)).toLocaleString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="w-20 border-r border-slate-100 text-center dark:border-neutral-800">
                                        <Checkbox
                                            checked={line.is_with_tax}
                                            onCheckedChange={(checked) => {
                                                updateSaleItem(line, {
                                                    is_with_tax: checked === true,
                                                });
                                            }}
                                            aria-label="Vendre avec taxe"
                                        />
                                    </TableCell>
                                    <TableCell className="w-28 px-3 text-right">
                                        {Number(line.total_diff ?? 0).toLocaleString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="w-12 p-0 text-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-10 text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                                            aria-label="Supprimer la ligne de vente"
                                            onPointerDown={(event) => event.stopPropagation()}
                                            onClick={() => {
                                                deleteSaleItem(line);
                                            }}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
