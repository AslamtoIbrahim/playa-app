import {
    Dialog,
    DialogContent,
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
import type { KeyboardEvent } from 'react';
import type { Item } from '@/types/item';
import type { Sale } from '@/types/sale';
import type { SaleItem } from '@/types/sale-item';
import { router } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale?: Sale;
    sales?: Sale[];
    items: Item[];
    availableStockByCategory?: Record<number, number>;
}

interface Draft {
    itemId: string;
    unitCount: string;
    salePrice: string;
    realPrice: string;
    isWithTax: boolean;
}

const initialDraft: Draft = {
    itemId: '',
    unitCount: '1',
    salePrice: '',
    realPrice: '',
    isWithTax: false,
};

export function GlobalSaleDialog({
    open,
    onOpenChange,
    sale,
    sales = [],
    items,
    availableStockByCategory = {},
}: Props) {
    const [draft, setDraft] = useState<Draft>(initialDraft);
    const [itemSelectOpen, setItemSelectOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState(sale ? String(sale.id) : '');
    const [saleSelectOpen, setSaleSelectOpen] = useState(false);
    const selectedSale = sale ?? sales.find((candidate) => String(candidate.id) === selectedSaleId);
    const boatlessSaleItems = sales.flatMap((currentSale) =>
        (currentSale.items ?? [])
            .filter((line) => !line.deleted_at && !line.boat_id),
    );
    const selectedItem = items.find((item) => String(item.id) === draft.itemId);
    const defaultPrice = selectedItem?.default_price ?? 0;
    const realPrice =
        draft.realPrice === '' ? defaultPrice : Number(draft.realPrice);
    const salePrice =
        draft.salePrice === '' ? defaultPrice : Number(draft.salePrice);
    const unitCount = Number(draft.unitCount || 0);
    const amount = Math.abs(unitCount) * realPrice;
    const tax = draft.isWithTax ? amount * 0.03 : 0;
    const totalDiff = (salePrice - realPrice) * Math.abs(unitCount);
    const remainingInvoiceCount = selectedItem
        ? availableStockByCategory[selectedItem.category_id]
        : undefined;
    const exceedsInvoiceQuantity =
        remainingInvoiceCount !== undefined &&
        Math.abs(unitCount) > remainingInvoiceCount;

    const updateDraft = (updates: Partial<Draft>): void => {
        setDraft((current) => ({ ...current, ...updates }));
    };

    const handleCellKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
        if (itemSelectOpen || saleSelectOpen) {
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            handleSave();

            return;
        }

        navigateToAdjacentCell(event);
    };

    const handleItemChange = (itemId: string): void => {
        const item = items.find((candidate) => String(candidate.id) === itemId);
        const price = item?.default_price ?? 0;
        updateDraft({
            itemId,
            realPrice: String(price),
            salePrice: String(price),
        });
    };

    const handleSave = (): void => {
        if (!selectedSale || !draft.itemId || !draft.unitCount || unitCount === 0) {
            toast.error('Choisissez une vente, un article et une quantité.');

            return;
        }

        if (!Number.isFinite(salePrice) || salePrice <= 0) {
            toast.error('Le prix de vente doit être supérieur à zéro.');

            return;
        }

        if (exceedsInvoiceQuantity) {
            toast.error(`La quantité dépasse le reste disponible sur cette facture (${remainingInvoiceCount}).`);

            return;
        }

        router.post(
            '/sale-items',
            {
                sale_id: selectedSale.id,
                invoice_item_id: null,
                item_id: Number(draft.itemId),
                boat_id: null,
                unit_count: unitCount > 0 ? -unitCount : unitCount,
                sale_price: salePrice,
                real_price: realPrice,
                is_with_tax: draft.isWithTax,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Ligne de vente ajout\u00e9e.');
                    setDraft(initialDraft);

                    if (!sale) {
                        setSelectedSaleId('');
                    }
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ??
                            'Stock insuffisant ou donn\u00e9es invalides.',
                        { duration: 6000 },
                    );
                },
            },
        );
    };

    const updateSaleItem = (line: SaleItem, updates: Partial<SaleItem>): void => {
        router.patch(`/sale-items/${line.id}`, updates, {
            preserveScroll: true,
            onSuccess: () => toast.success('Ligne de vente mise à jour.'),
            onError: (errors) => toast.error(Object.values(errors)[0] ?? 'Impossible de mettre à jour cette ligne.'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88vh] w-11/12 max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-amber-100 p-0 shadow-2xl sm:max-w-5xl dark:border-amber-950 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 border-b border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-3 pr-12 text-left dark:border-amber-950 dark:from-amber-950/50 dark:via-neutral-950 dark:to-yellow-950/30">
                    <div className="mb-1 text-[10px] font-bold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-300">
                        {'Vente \u00b7 '}
                        {selectedSale?.customer?.name ?? (selectedSale ? `Vente #${selectedSale.id}` : 'Choisissez une vente')}
                    </div>
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-neutral-100">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20"><ShoppingCart className="size-4" /></span>
                        Vente globale · Articles avec ou sans bateau
                    </DialogTitle>
                    <p className="pl-12 text-xs text-slate-500 dark:text-neutral-400">
                        Règle : la quantité vendue ne doit pas dépasser le stock restant de cette catégorie pour la journée.
                    </p>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-auto bg-slate-50/60 p-3 dark:bg-neutral-950">
                    <Table className="w-auto min-w-212.5 border-collapse">
                        <TableHeader className="sticky top-0 z-20 bg-slate-50/80 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="min-w-40 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client
                                </TableHead>
                                <TableHead className="min-w-40 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Article
                                </TableHead>
                                <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    {'Quantit\u00e9'}
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Prix vente
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="group h-10 min-h-10 border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-neutral-800 dark:hover:bg-neutral-900/40">
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
                                <TableCell className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    <SearchSelect
                                        value={draft.itemId}
                                        options={items.map((item) => ({
                                            id: item.id,
                                            name: item.name,
                                        }))}
                                        placeholder="Article…"
                                        emptyMessage="Aucun article trouvé."
                                        open={itemSelectOpen}
                                        onOpenChange={setItemSelectOpen}
                                        onSelect={(id) =>
                                            handleItemChange(String(id))
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
                                        min="0.01"
                                        step="any"
                                        value={
                                            draft.salePrice === ''
                                                ? defaultPrice
                                                : draft.salePrice
                                        }
                                        onChange={(event) =>
                                            updateDraft({
                                                salePrice: event.target.value,
                                            })
                                        }
                                        onKeyDown={handleCellKeyDown}
                                        className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        aria-label="Prix de vente"
                                    />
                                </TableCell>
                                <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    <Input
                                        type="number"
                                        step="any"
                                        value={
                                            draft.realPrice === ''
                                                ? defaultPrice
                                                : draft.realPrice
                                        }
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
                            </TableRow>
                            {boatlessSaleItems.map((line) => (
                                <TableRow key={line.id} className="group h-10 border-b border-slate-100 dark:border-neutral-800">
                                    <TableCell className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        <SearchSelect value={String(line.sale_id)} options={sales.map((option) => ({ id: option.id, name: option.customer?.name ?? `Vente #${option.id}` }))} placeholder="Client..." emptyMessage="Aucun client trouvé." onSelect={(id) => updateSaleItem(line, { sale_id: Number(id) })} className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800" />
                                    </TableCell>
                                    <TableCell className="min-w-40 border-r border-slate-100 px-3 dark:border-neutral-800">{line.item?.name ?? `Article #${line.item_id}`}</TableCell>
                                    <TableCell className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800"><Input type="number" min="0" step="any" defaultValue={Math.abs(Number(line.unit_count))} onBlur={(event) => { const count = Number(event.target.value); if (count > 0) { updateSaleItem(line, { unit_count: -count }); } }} onKeyDown={navigateToAdjacentCell} className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" aria-label="Quantité vendue" /></TableCell>
                                    <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800"><Input type="number" min="0.01" step="any" defaultValue={line.sale_price} onBlur={(event) => { const price = Number(event.target.value); if (price > 0) { updateSaleItem(line, { sale_price: price }); } }} onKeyDown={navigateToAdjacentCell} className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" aria-label="Prix de vente" /></TableCell>
                                    <TableCell className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800"><Input type="number" min="0" step="any" defaultValue={line.real_price} onBlur={(event) => updateSaleItem(line, { real_price: Number(event.target.value) })} onKeyDown={navigateToAdjacentCell} className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" aria-label="Prix réel" /></TableCell>
                                    <TableCell className="w-28 border-r border-slate-100 px-3 text-right dark:border-neutral-800">{Math.abs(Number(line.amount)).toLocaleString('fr-FR')}</TableCell>
                                    <TableCell className="w-20 border-r border-slate-100 px-3 text-right dark:border-neutral-800">{Math.abs(Number(line.tax)).toLocaleString('fr-FR')}</TableCell>
                                    <TableCell className="w-20 border-r border-slate-100 text-center dark:border-neutral-800"><Checkbox checked={line.is_with_tax} onCheckedChange={(checked) => updateSaleItem(line, { is_with_tax: checked === true })} aria-label="Vendre avec taxe" /></TableCell>
                                    <TableCell className="w-28 px-3 text-right">{Number(line.total_diff ?? 0).toLocaleString('fr-FR')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {exceedsInvoiceQuantity && (
                        <div role="alert" className="mt-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            <AlertCircle className="size-4 shrink-0" />
                            Quantité supérieure au stock restant : {remainingInvoiceCount}.
                        </div>
                    )}
                    {selectedItem && (!Number.isFinite(salePrice) || salePrice <= 0) && (
                        <div role="alert" className="mt-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            <AlertCircle className="size-4 shrink-0" />
                            Le prix de vente doit être supérieur à zéro.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
