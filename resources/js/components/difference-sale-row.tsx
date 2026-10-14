import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDifferenceAmount } from '@/lib/differences';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { destroy, store, update } from '@/routes/sale-items';
import type { Difference } from '@/types/difference';
import type { Sale } from '@/types/sale';
import type { SaleItem } from '@/types/sale-item';
import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { SearchSelect } from './search-select';

interface Props {
    difference: Difference;
    sales: Sale[];
    saleItem?: SaleItem;
    remaining: number;
}

interface FlashMessage {
    error?: string | null;
}

export function DifferenceSaleRow({
    difference,
    sales,
    saleItem,
    remaining,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [saleSelectOpen, setSaleSelectOpen] = useState(false);
    const [quantity, setQuantity] = useState(
        String(saleItem?.unit_count ?? remaining),
    );
    const [saleId, setSaleId] = useState(String(saleItem?.sale_id ?? ''));
    const isNew = !saleItem;
    const saleOptions = useMemo(
        () =>
            sales.map((sale) => ({
                id: sale.id,
                name: sale.customer?.name ?? 'Client Inconnu',
            })),
        [sales],
    );
    const saleDiff =
        (Number(difference.total_diff) / (Number(difference.unit_count) || 1)) *
        Number(quantity || 0);

    const save = (
        nextSaleId = Number(saleId),
        nextQuantity = Number(quantity),
    ) => {
        if (loading || !nextSaleId || nextQuantity <= 0) {
            return;
        }

        setLoading(true);
        const options = {
            preserveScroll: true,
            onSuccess: (page: Page) => {
                const flash = page.props.flash as FlashMessage | undefined;

                if (flash?.error) {
                    toast.error(flash.error, { duration: 6000 });
                } else {
                    toast.success(isNew ? 'Vente enregistrée' : 'Mis à jour');

                    if (isNew) {
                        setSaleId('');
                    }
                }
            },
            onError: (errors: Record<string, string>) =>
                toast.error(
                    Object.values(errors)[0] ??
                        "La répartition n'a pas pu être vendue.",
                    { duration: 6000 },
                ),
            onFinish: () => setLoading(false),
        };

        if (saleItem) {
            router.patch(
                update(saleItem.id),
                { sale_id: nextSaleId, unit_count: nextQuantity },
                options,
            );
        } else {
            router.post(
                store(),
                {
                    sale_id: nextSaleId,
                    difference_id: difference.id,
                    unit_count: nextQuantity,
                },
                options,
            );
        }
    };

    const remove = () => {
        if (!saleItem || loading) {
            return;
        }

        setLoading(true);
        router.delete(destroy(saleItem.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Vente supprimée'),
            onFinish: () => setLoading(false),
        });
    };

    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            save();

            return;
        }

        if (!saleSelectOpen) {
            navigateToAdjacentCell(event);
        }
    };

    return (
        <TableRow className="group h-10 min-h-10 border-b border-slate-100 dark:border-neutral-800">
            <TableCell className="min-w-44 border-r p-0 pl-3 dark:border-neutral-800">
                <SearchSelect
                    value={saleId}
                    options={saleOptions}
                    placeholder="Client / vente..."
                    emptyMessage="Aucune vente pour cette journée."
                    open={saleSelectOpen}
                    onOpenChange={setSaleSelectOpen}
                    onKeyDown={onKeyDown}
                    onSelect={(id) => {
                        setSaleId(id.toString());
                        setSaleSelectOpen(false);

                        if (!isNew) {
                            save(Number(id));
                        }
                    }}
                />
            </TableCell>
            <TableCell className="w-24 border-r p-0 text-center dark:border-neutral-800">
                <Input
                    type="number"
                    min="0.01"
                    step="any"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    onBlur={() => {
                        if (
                            !isNew &&
                            Number(quantity) !== Number(saleItem?.unit_count)
                        ) {
                            save();
                        }
                    }}
                    onKeyDown={onKeyDown}
                    className="h-10 border-none bg-transparent text-center focus-visible:ring-0"
                    aria-label="Quantité vendue"
                />
            </TableCell>
            <TableCell className="w-28 border-r text-center dark:border-neutral-800">
                {Number(difference.real_price).toLocaleString('fr-FR')} DH
            </TableCell>
            <TableCell
                className={`w-28 pr-6 text-right font-bold ${saleDiff < 0 ? 'text-red-500 dark:text-red-400' : saleDiff > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-neutral-300'}`}
            >
                {saleDiff > 0 ? '+' : ''}
                {formatDifferenceAmount(saleDiff)}
            </TableCell>
            <TableCell className="w-15 min-w-15 p-0 text-center">
                {loading ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-slate-400" />
                ) : isNew ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ajouter cette quantité à la vente"
                        disabled={!saleId || Number(quantity) <= 0}
                        onClick={() => save()}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Retirer la ligne de la vente"
                        onClick={remove}
                        className="opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}
