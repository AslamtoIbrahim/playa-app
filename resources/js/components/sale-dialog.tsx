import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { InvoiceItem } from '@/types/invoice-item';
import { SaleItem } from '@/types/sale-item';
import { Sale } from '@/types/sale';
import type { Item as CatalogItem } from '@/types/item';
import { router } from '@inertiajs/react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: InvoiceItem[];
    sales: Sale[];
    catalogItems: CatalogItem[];
}

export function SaleDialog({ open, onOpenChange, items, sales, catalogItems }: Props) {
    const [saleIds, setSaleIds] = useState<Record<string, string>>({});
    const [counts, setCounts] = useState<Record<string, string>>({});
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [realPrices, setRealPrices] = useState<Record<string, string>>({});
    const [taxFlags, setTaxFlags] = useState<Record<string, boolean>>({});
    const [openSaleIds, setOpenSaleIds] = useState<Record<string, boolean>>({});
    const [itemIds, setItemIds] = useState<Record<string, string>>({});
    const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({});

    const saleOptions = sales.map((sale) => ({
        id: sale.id,
        name: sale.customer?.name ?? `Vente #${sale.id}`,
    }));

    const remaining = (item: InvoiceItem): number =>
        Math.max(
            0,
            Number(item.unit_count) -
                (item.sale_items ?? []).filter((saleItem) => !saleItem.deleted_at).reduce(
                    (sum, saleItem) =>
                        sum + Math.abs(Number(saleItem.unit_count)),
                    0,
                ),
        );

    const save = (
        item: InvoiceItem,
        line?: SaleItem,
        selectedSaleId?: number,
        selectedItemId?: number,
    ): void => {
        const key = line ? `sale-${line.id}` : `item-${item.id}`;
        const count = Number(counts[key] ?? (line ? Math.abs(Number(line.unit_count)) : remaining(item)));
        const salePrice = Number(prices[key] ?? line?.sale_price ?? item.unit_price);
        const realPrice = Number(
            realPrices[key] ?? line?.real_price ??
                item.differences?.[0]?.real_price ??
                item.unit_price,
        );

        const saleId = selectedSaleId ?? Number(saleIds[key] ?? line?.sale_id);

        if (!saleId || !count) {
            toast.error('Choisissez une vente et une quantit\u00e9.');

            return;
        }

        const payload = {
                sale_id: saleId,
                invoice_item_id: item.id,
                item_id: selectedItemId ?? item.item_id,
                boat_id: item.boat_id,
                unit_count: count > 0 ? -count : count,
                sale_price: salePrice,
                real_price: realPrice,
                is_with_tax: taxFlags[key] ?? line?.is_with_tax ?? false,
            };
        const options = {
                preserveScroll: true,
                onSuccess: () => {
                    if (!line) {
                        setSaleIds((current) => {
                            const next = { ...current };
                            delete next[key];

                            return next;
                        });
                        setCounts((current) => {
                            const next = { ...current };
                            delete next[key];

                            return next;
                        });
                        setPrices((current) => {
                            const next = { ...current };
                            delete next[key];

                            return next;
                        });
                        setRealPrices((current) => {
                            const next = { ...current };
                            delete next[key];

                            return next;
                        });
                        setTaxFlags((current) => {
                            const next = { ...current };
                            delete next[key];

                            return next;
                        });
                    }

                    toast.success(line ? 'Ligne de vente mise à jour.' : 'Ligne de vente enregistrée.');
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(
                        Object.values(errors)[0] ??
                            'Stock insuffisant ou donn\u00e9es invalides.',
                        { duration: 6000 },
                    );
                },
            };

        if (line) {
router.patch(`/sale-items/${line.id}`, payload, options);
} else {
router.post('/sale-items', payload, options);
}
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-amber-100 p-0 shadow-2xl sm:max-w-5xl dark:border-amber-950 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 border-b border-amber-100 bg-linear-to-br from-amber-50 via-white to-orange-50 p-4 pr-12 text-left dark:border-amber-950 dark:from-amber-950/50 dark:via-neutral-950 dark:to-orange-950/30">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-neutral-100">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <ShoppingCart className="size-4" />
                        </span>
                        {'Vente \u00b7 Articles s\u00e9lectionn\u00e9s'}
                    </DialogTitle>
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
                                    Prix vente
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
                            {items.map((item) => {
                                if (remaining(item) <= 0) {
return null;
}

                                const key = `item-${item.id}`;
                                const count = Number(
                                    counts[key] ?? remaining(item),
                                );
                                const realPrice = Number(
                                    realPrices[key] ??
                                        item.differences?.[0]?.real_price ??
                                        item.unit_price,
                                );
                                const salePrice = Number(
                                    prices[key] ?? item.unit_price,
                                );
                                const amount = count * realPrice;
                                const isWithTax = taxFlags[key] ?? false;

                                return (
                                    <TableRow
                                        key={item.id}
                                        className="group h-10 min-h-10 border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-neutral-800 dark:hover:bg-neutral-900/40"
                                    >
                                        <TableCell className="min-w-40 border-r border-slate-100 p-0 pl-1 dark:border-neutral-800">
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

                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        save(item);

                                                        return;
                                                    }

                                                    navigateToAdjacentCell(
                                                        event,
                                                    );
                                                }}
                                                onSelect={(id) =>
                                                    setSaleIds((current) => ({
                                                        ...current,
                                                        [key]: String(id),
                                                    }))
                                                }
                                                className="h-10 w-full border-none bg-transparent px-3  font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                            />
                                        </TableCell>
                                        <TableCell className="min-w-28 border-r border-slate-100 px-3 py-0 font-medium capitalize dark:border-neutral-800">
                                            <span className="block truncate text-slate-700 dark:text-neutral-300">
                                                {item.boat?.name ?? '\u2014'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="min-w-32 border-r border-slate-100 px-3 py-0 font-medium capitalize dark:border-neutral-800">
                                            <span className="block truncate text-slate-900 dark:text-neutral-100">
                                                {item.item?.name ?? 'Article'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800">
                                            <Input
                                                type="number"
                                                step="any"
                                                value={
                                                    counts[key] ??
                                                    remaining(item)
                                                }
                                                onChange={(event) =>
                                                    setCounts((current) => ({
                                                        ...current,
                                                        [key]:
                                                            event.target.value,
                                                    }))
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        save(item);

                                                        return;
                                                    }

                                                    navigateToAdjacentCell(
                                                        event,
                                                    );
                                                }}
                                                className="h-10 border-none bg-transparent text-center text-slate-900 transition-all focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                aria-label="Quantit\u00e9 vendue"
                                            />
                                        </TableCell>
                                        <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                            <Input
                                                type="number"
                                                step="any"
                                                value={
                                                    realPrices[key] ??
                                                    item.differences?.[0]
                                                        ?.real_price ??
                                                    item.unit_price
                                                }
                                                onChange={(event) =>
                                                    setRealPrices(
                                                        (current) => ({
                                                            ...current,
                                                            [key]:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        save(item);

                                                        return;
                                                    }

                                                    navigateToAdjacentCell(
                                                        event,
                                                    );
                                                }}
                                                className="h-10 border-none bg-transparent text-center text-slate-900 transition-all focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                aria-label="Prix r\u00e9el"
                                            />
                                        </TableCell>
                                        <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                            <Input
                                                type="number"
                                                step="any"
                                                value={
                                                    prices[key] ??
                                                    item.unit_price
                                                }
                                                onChange={(event) =>
                                                    setPrices((current) => ({
                                                        ...current,
                                                        [key]:
                                                            event.target.value,
                                                    }))
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        save(item);

                                                        return;
                                                    }

                                                    navigateToAdjacentCell(
                                                        event,
                                                    );
                                                }}
                                                className="h-10 border-none bg-transparent text-center text-slate-900 transition-all focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                aria-label="Prix de vente"
                                            />
                                        </TableCell>
                                        <TableCell className="w-28 border-r border-slate-100 px-3 py-0 text-right text-xs font-bold tabular-nums text-slate-700 dark:border-neutral-800 dark:text-neutral-300">
                                            {amount.toLocaleString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="w-20 border-r border-slate-100 px-3 py-0 text-right text-xs tabular-nums text-slate-600 dark:border-neutral-800 dark:text-neutral-400">
                                            {(isWithTax
                                                ? amount * 0.03
                                                : 0
                                            ).toLocaleString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="w-20 border-r border-slate-100 p-0 text-center dark:border-neutral-800">
                                            <Checkbox
                                                checked={isWithTax}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        event.currentTarget.click();

                                                        return;
                                                    }

                                                    navigateToAdjacentCell(event);
                                                }}
                                                onCheckedChange={(checked) =>
                                                    setTaxFlags((current) => ({
                                                        ...current,
                                                        [key]: checked === true,
                                                    }))
                                                }
                                                aria-label="Vendre avec taxe"
                                            />
                                        </TableCell>
                                        <TableCell className={cn('w-28 px-3 py-0 text-right text-xs font-bold tabular-nums', (salePrice - realPrice) * count < 0 ? 'text-rose-600 dark:text-rose-400' : (salePrice - realPrice) * count > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-neutral-300')}>
                                            {(
                                                (salePrice - realPrice) *
                                                count
                                            ).toLocaleString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="w-12" />
                                    </TableRow>
                                );
                            })}
                            {items.flatMap((item) =>
                                (item.sale_items ?? []).map((line) => {
                                    const key = `sale-${line.id}`;
                                    const quantity = counts[key] ?? String(Math.abs(Number(line.unit_count)));

                                    return (
                                        <TableRow key={key} className="group h-10 border-b border-slate-100 dark:border-neutral-800">
                                            <TableCell className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                                <SearchSelect
                                                    value={saleIds[key] ?? String(line.sale_id)}
                                                    options={saleOptions}
                                                    placeholder="Client..."
                                                    emptyMessage="Aucun client trouvé."
                                                    open={openSaleIds[key] ?? false}
                                                    onOpenChange={(open) => setOpenSaleIds((state) => ({ ...state, [key]: open }))}
                                                    onKeyDown={(event) => {
                                                        if (openSaleIds[key]) {
                                                            return;
                                                        }

                                                        navigateToAdjacentCell(event);
                                                    }}
                                                    onSelect={(id) => {
                                                        const selectedId = Number(id);
                                                        setSaleIds((state) => ({ ...state, [key]: String(selectedId) }));
                                                        save(item, line, selectedId);
                                                    }}
                                                    className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                                />
                                            </TableCell>
                                            <TableCell className="min-w-28 border-r border-slate-100 px-3 dark:border-neutral-800">{item.boat?.name ?? '—'}</TableCell>
                                            <TableCell className="min-w-32 border-r border-slate-100 p-0 dark:border-neutral-800">
                                                <SearchSelect
                                                    value={itemIds[key] ?? String(line.item_id)}
                                                    options={catalogItems.map((option) => ({ id: option.id, name: option.name }))}
                                                    placeholder="Article..."
                                                    emptyMessage="Aucun article trouvé."
                                                    open={openItemIds[key] ?? false}
                                                    onOpenChange={(open) => setOpenItemIds((state) => ({ ...state, [key]: open }))}
                                                    onKeyDown={navigateToAdjacentCell}
                                                    onSelect={(id) => {
                                                        const selectedId = Number(id);
                                                        setItemIds((state) => ({ ...state, [key]: String(selectedId) }));
                                                        save(item, line, undefined, selectedId);
                                                    }}
                                                    className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                                />
                                            </TableCell>
                                            <TableCell className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800">
                                                <Input type="number" step="any" value={quantity} onChange={(event) => setCounts((state) => ({ ...state, [key]: event.target.value }))} onBlur={() => save(item, line)} onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        save(item, line);
                                                    } else {
                                                        navigateToAdjacentCell(event);
                                                    }
                                                }} className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" aria-label="Quantité vendue" />
                                            </TableCell>
                                            <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800"><Input type="number" step="any" value={realPrices[key] ?? line.real_price} onChange={(event) => setRealPrices((state) => ({ ...state, [key]: event.target.value }))} onBlur={() => save(item, line)} onKeyDown={navigateToAdjacentCell} className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" aria-label="Prix réel" /></TableCell>
                                            <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800"><Input type="number" step="any" value={prices[key] ?? line.sale_price} onChange={(event) => setPrices((state) => ({ ...state, [key]: event.target.value }))} onBlur={() => save(item, line)} onKeyDown={navigateToAdjacentCell} className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" aria-label="Prix de vente" /></TableCell>
                                            <TableCell className="w-28 border-r border-slate-100 px-3 text-right dark:border-neutral-800">{Math.abs(Number(line.amount)).toLocaleString('fr-FR')}</TableCell>
                                            <TableCell className="w-20 border-r border-slate-100 px-3 text-right dark:border-neutral-800">{Math.abs(Number(line.tax)).toLocaleString('fr-FR')}</TableCell>
                                            <TableCell className="w-20 border-r border-slate-100 text-center dark:border-neutral-800">
                                                <Checkbox checked={taxFlags[key] ?? line.is_with_tax} onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        event.currentTarget.click();

                                                        return;
                                                    }

                                                    navigateToAdjacentCell(event);
                                                }} onCheckedChange={(checked) => {
                                                    const isWithTax = checked === true;
                                                    setTaxFlags((state) => ({ ...state, [key]: isWithTax }));
                                                    router.patch(`/sale-items/${line.id}`, { is_with_tax: isWithTax }, { preserveScroll: true });
                                                }} aria-label="Vendre avec taxe" />
                                            </TableCell>
                                            <TableCell className="w-28 px-3 text-right">{Number(line.total_diff ?? 0).toLocaleString('fr-FR')}</TableCell>
                                            <TableCell className="w-12 p-0 text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10 text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                                                    aria-label="Supprimer la ligne de vente"
                                                    onClick={() => {
                                                        router.delete(`/sale-items/${line.id}`, {
                                                            preserveScroll: true,
                                                            onSuccess: () => toast.success('Ligne de vente supprimée.'),
                                                            onError: () => toast.error('Impossible de supprimer cette ligne.'),
                                                        });
                                                    }}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }),
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SaleDialog;
