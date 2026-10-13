import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDifferenceAmount } from '@/lib/differences';
import { destroy, store, update } from '@/routes/sale-items';
import type { Difference } from '@/types/difference';
import type { Sale } from '@/types/sale';
import type { SaleItem } from '@/types/sale-item';
import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SearchSelect } from './search-select';

interface Props {
    difference: Difference;
    sales: Sale[];
}

interface FlashMessage {
    error?: string | null;
}

export function DifferenceSaleRow({ difference, sales }: Props) {
    const [loading, setLoading] = useState(false);
    const [saleSelectOpen, setSaleSelectOpen] = useState(false);
    const saleItem: SaleItem | undefined = difference.sale_items?.[0];
    const saleOptions = sales.map((sale) => ({
        id: sale.id,
        name: sale.customer?.name ?? 'Client Inconnu',
    }));

    const save = (saleId: number): void => {
        if (loading) {
            return;
        }

        setLoading(true);
        const options = {
            preserveScroll: true,
            onSuccess: (page: Page) => {
                const flash = page.props.flash as FlashMessage | undefined;

                if (flash?.error) {
                    toast.error(flash.error, { duration: 6000 });

                    return;
                }

                toast.success(saleItem ? 'Mis à jour' : 'Vente enregistrée');
            },
            onError: (errors: Record<string, string>) => {
                toast.error(
                    Object.values(errors)[0] ??
                        "La répartition n'a pas pu être vendue.",
                    { duration: 6000 },
                );
            },
            onFinish: () => setLoading(false),
        };

        if (saleItem) {
            router.patch(update(saleItem.id), { sale_id: saleId }, options);
        } else {
            router.post(
                store(),
                { sale_id: saleId, difference_id: difference.id },
                options,
            );
        }
    };

    const remove = (): void => {
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

    return (
        <TableRow className="group h-10 min-h-10 border-b border-slate-100 dark:border-neutral-800">
            <TableCell className="min-w-44 border-r p-0 pl-3 dark:border-neutral-800">
                <SearchSelect
                    value={saleItem?.sale_id.toString() ?? ''}
                    options={saleOptions}
                    placeholder="Vente..."
                    emptyMessage="Aucune vente pour cette journée."
                    open={saleSelectOpen}
                    onOpenChange={setSaleSelectOpen}
                    onSelect={(id) => save(Number(id))}
                />
            </TableCell>
            <TableCell className="w-20 border-r text-center dark:border-neutral-800">
                {difference.unit_count}
            </TableCell>
            <TableCell className="w-28 border-r text-center dark:border-neutral-800">
                {Number(difference.real_price).toLocaleString('fr-FR')} DH
            </TableCell>
            <TableCell
                className={`w-28 pr-6 text-right font-bold ${Number(difference.total_diff) < 0 ? 'text-red-500 dark:text-red-400' : Number(difference.total_diff) > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-neutral-300'}`}
            >
                {Number(difference.total_diff) > 0 ? '+' : ''}
                {formatDifferenceAmount(difference.total_diff)}
            </TableCell>
            <TableCell className="w-15 min-w-15 p-0 text-center">
                {loading ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-slate-400" />
                ) : saleItem ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Retirer la ligne de la vente"
                        onClick={remove}
                        className="opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                ) : null}
            </TableCell>
        </TableRow>
    );
}
