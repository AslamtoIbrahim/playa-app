import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SearchSelect } from '@/components/search-select';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import type { KeyboardEvent } from 'react';
import type { Boat } from '@/types/boat';
import type { Item } from '@/types/item';
import type { Sale } from '@/types/sale';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale;
    items: Item[];
    boats: Boat[];
}

interface Draft {
    itemId: string;
    boatId: string;
    unitCount: string;
    salePrice: string;
    realPrice: string;
    isWithTax: boolean;
}

const initialDraft: Draft = {
    itemId: '',
    boatId: '',
    unitCount: '-1',
    salePrice: '',
    realPrice: '',
    isWithTax: false,
};

export function GlobalSaleDialog({
    open,
    onOpenChange,
    sale,
    items,
    boats,
}: Props) {
    const [draft, setDraft] = useState<Draft>(initialDraft);
    const [itemSelectOpen, setItemSelectOpen] = useState(false);
    const [boatSelectOpen, setBoatSelectOpen] = useState(false);
    const selectedItem = items.find((item) => String(item.id) === draft.itemId);
    const defaultPrice = selectedItem?.default_price ?? 0;
    const realPrice =
        draft.realPrice === '' ? defaultPrice : Number(draft.realPrice);
    const salePrice =
        draft.salePrice === '' ? defaultPrice : Number(draft.salePrice);
    const unitCount = Number(draft.unitCount || 0);
    const amount = unitCount * realPrice;
    const tax = draft.isWithTax ? amount * 0.03 : 0;
    const totalDiff = (salePrice - realPrice) * unitCount;

    const updateDraft = (updates: Partial<Draft>): void => {
        setDraft((current) => ({ ...current, ...updates }));
    };

    const handleCellKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
        if (itemSelectOpen || boatSelectOpen) {
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
        if (!draft.itemId || !draft.unitCount || unitCount === 0) {
            toast.error('Choisissez un article et une quantit\u00e9.');

            return;
        }

        router.post(
            '/sale-items',
            {
                sale_id: sale.id,
                invoice_item_id: null,
                item_id: Number(draft.itemId),
                boat_id: draft.boatId ? Number(draft.boatId) : null,
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
                    onOpenChange(false);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] w-11/12 max-w-7xl flex-col gap-0 overflow-hidden rounded-2xl border border-amber-200 p-0 shadow-2xl sm:max-w-7xl dark:border-amber-950 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 border-b border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-3 pr-12 text-left dark:border-amber-950 dark:from-amber-950/50 dark:via-neutral-950 dark:to-yellow-950/30">
                    <div className="mb-1 text-[10px] font-bold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-300">
                        {'Vente \u00b7 '}
                        {sale.customer?.name ?? `Vente #${sale.id}`}
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-neutral-100">
                        Ajouter un article
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 overflow-x-hidden overflow-y-auto bg-slate-50/60 p-2 dark:bg-neutral-950">
                    <table className="w-full table-fixed border-collapse text-xs">
                        <TableHeader className="sticky top-0 z-10 bg-amber-100 shadow-sm dark:bg-amber-950/70">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[16%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    Article
                                </TableHead>
                                <TableHead className="w-[14%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    Bateau
                                </TableHead>
                                <TableHead className="w-[10%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    {'Quantit\u00e9'}
                                </TableHead>
                                <TableHead className="w-[10%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    Prix vente
                                </TableHead>
                                <TableHead className="w-[10%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    {'Prix r\u00e9el'}
                                </TableHead>
                                <TableHead className="w-[12%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    Montant
                                </TableHead>
                                <TableHead className="w-[10%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    Taxe 3%
                                </TableHead>
                                <TableHead className="w-[10%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    Avec taxe
                                </TableHead>
                                <TableHead className="w-[8%] px-1 py-2 text-center text-[10px] leading-tight whitespace-normal">
                                    Total diff
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="bg-white hover:bg-amber-50/50 dark:bg-neutral-900 dark:hover:bg-amber-950/20">
                                <TableCell className="max-w-0 overflow-hidden px-1 py-1">
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
                                        className="h-8 min-w-0 border-slate-200 bg-white px-1 text-xs text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                    />
                                </TableCell>
                                <TableCell className="max-w-0 overflow-hidden px-1 py-1">
                                    <SearchSelect
                                        value={draft.boatId}
                                        options={boats.map((boat) => ({
                                            id: boat.id,
                                            name: boat.name,
                                        }))}
                                        placeholder="Sans bateau"
                                        emptyMessage="Aucun bateau trouvé."
                                        open={boatSelectOpen}
                                        onOpenChange={setBoatSelectOpen}
                                        onSelect={(id) =>
                                            updateDraft({ boatId: String(id) })
                                        }
                                        onKeyDown={handleCellKeyDown}
                                        className="h-8 min-w-0 border-slate-200 bg-white px-1 text-xs text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                    />
                                </TableCell>
                                <TableCell className="px-1 py-1">
                                    <Input
                                        type="number"
                                        step="any"
                                        value={draft.unitCount}
                                        onChange={(event) =>
                                            updateDraft({
                                                unitCount: event.target.value,
                                            })
                                        }
                                        onKeyDown={handleCellKeyDown}
                                        className="h-8 w-full min-w-0 border-slate-200 px-1 text-center text-xs dark:border-neutral-700 dark:bg-neutral-900"
                                        aria-label="Quantit\u00e9 vendue"
                                    />
                                </TableCell>
                                <TableCell className="px-1 py-1">
                                    <Input
                                        type="number"
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
                                        className="h-8 w-full min-w-0 border-slate-200 px-1 text-right text-xs dark:border-neutral-700 dark:bg-neutral-900"
                                        aria-label="Prix de vente"
                                    />
                                </TableCell>
                                <TableCell className="px-1 py-1">
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
                                        className="h-8 w-full min-w-0 border-slate-200 px-1 text-right text-xs dark:border-neutral-700 dark:bg-neutral-900"
                                        aria-label="Prix r\u00e9el"
                                    />
                                </TableCell>
                                <TableCell className="px-1 py-1 text-right text-[11px] font-semibold tabular-nums">
                                    {amount.toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="px-1 py-1 text-right text-[11px] tabular-nums">
                                    {tax.toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="text-center">
                                    <input
                                        type="checkbox"
                                        checked={draft.isWithTax}
                                        onChange={(event) =>
                                            updateDraft({
                                                isWithTax: event.target.checked,
                                            })
                                        }
                                        aria-label="Vendre avec taxe"
                                        onKeyDown={handleCellKeyDown}
                                    />
                                </TableCell>
                                <TableCell className="px-1 py-1 text-right text-[11px] font-semibold tabular-nums">
                                    {totalDiff.toLocaleString('fr-FR')}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </table>
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        <span>
                            {
                                'Appuyez sur Entr\u00e9e pour enregistrer. Le stock de la cat\u00e9gorie est v\u00e9rifi\u00e9 avant validation.'
                            }
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
