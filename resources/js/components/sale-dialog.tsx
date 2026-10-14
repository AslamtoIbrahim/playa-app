import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { InvoiceItem } from '@/types/invoice-item';
import type { Difference } from '@/types/difference';
import { Sale } from '@/types/sale';
import { AlertCircle, Ship, ShoppingCart } from 'lucide-react';
import { Fragment, useMemo } from 'react';
import { DifferenceSaleRow } from './difference-sale-row';
import { Badge } from './ui/badge';
import MissingDialogSale from './missing-dialog-sale';
import type { DailySession } from '@/types/daily-session';
import type { Customer } from '@/types/customer';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Lignes de facture d'achat à vendre (une ou plusieurs). */
    items: InvoiceItem[];
    /** Ventes de la journée en cours, seules cibles possibles. */
    sales: Sale[];
    /** Session courante (via sa zone) pour créer la vente manquante. */
    session: DailySession | null;
    /** Clients disponibles pour la nouvelle vente. */
    customers: Customer[];
}

/**
 * Dialogue de vente : répartit une ou plusieurs lignes de facture d'achat
 * vers des ventes de la même journée.
 *
 * Chaque ligne de répartition est vendue au client et avec les valeurs déjà
 * définis dans la boîte de dialogue des différences.
 */
export function SaleDialog({
    open,
    onOpenChange,
    items,
    sales,
    session,
    customers,
}: Props) {
    const handleOpenChange = (nextOpen: boolean): void => {
        onOpenChange(nextOpen);
    };

    const remainingTotal = useMemo((): number => {
        {
            return items.reduce((sum, item) => {
                {
                    return (
                        sum +
                        (item.differences ?? []).reduce(
                            (remaining, difference) =>
                                remaining +
                                Math.max(
                                    0,
                                    Number(difference.unit_count) -
                                        (difference.sale_items ?? []).reduce(
                                            (count, saleItem) =>
                                                count +
                                                Number(saleItem.unit_count),
                                            0,
                                        ),
                                ),
                            0,
                        )
                    );
                }
            }, 0);
        }
    }, [items]);

    const title = useMemo((): string => {
        {
            if (items.length === 0) {
                {
                    return 'Vente';
                }
            }

            if (items.length === 1) {
                {
                    return items[0].item?.name || 'Article';
                }
            }

            return `${items.length} articles`;
        }
    }, [items]);

    const hasNoSale = sales.length === 0;

    const canCreateSale = session !== null && customers.length > 0;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-fit flex-col gap-0 overflow-hidden border border-slate-200 p-0 shadow-lg sm:max-w-4xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 border-b border-slate-300 bg-slate-50/50 p-6 pb-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="flex flex-col items-start justify-between gap-4 pr-8">
                        <div className="flex w-full items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900 capitalize dark:text-neutral-100">
                                <span className="text-slate-500 dark:text-neutral-400">
                                    Vente
                                </span>
                                : {title}
                            </DialogTitle>

                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors',
                                        remainingTotal <= 0
                                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-400'
                                            : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400',
                                    )}
                                >
                                    {remainingTotal <= 0
                                        ? 'TERMINÉ'
                                        : `RESTE: ${remainingTotal}`}
                                    {remainingTotal < 0 && (
                                        <AlertCircle className="h-3.5 w-3.5" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {hasNoSale && canCreateSale && (
                            <div className="flex w-full items-center gap-2">
                                <div className="flex w-full items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                    Aucune vente pour cette journée.
                                </div>
                                <MissingDialogSale
                                    sessionId={session.id}
                                    sessionDate={session.session_date}
                                    customers={customers}
                                />
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto dark:bg-neutral-950">
                    <Table className="w-auto border-collapse">
                        <TableHeader className="sticky top-0 z-20 bg-slate-50/80 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="min-w-44 py-4 pl-6 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client
                                </TableHead>
                                <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Qté
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    P.R
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Diff Total
                                </TableHead>
                                <TableHead className="w-15 py-4"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody key={items.map((item) => item.id).join('-')}>
                            {items.map((item) => {
                                {
                                    const differences: Difference[] =
                                        item.differences || [];
                                    const remaining = differences.reduce(
                                        (sum, difference) =>
                                            sum +
                                            Math.max(
                                                0,
                                                Number(difference.unit_count) -
                                                    (
                                                        difference.sale_items ??
                                                        []
                                                    ).reduce(
                                                        (count, saleItem) =>
                                                            count +
                                                            Number(
                                                                saleItem.unit_count,
                                                            ),
                                                        0,
                                                    ),
                                            ),
                                        0,
                                    );

                                    return (
                                        <Fragment key={item.id}>
                                            {/* Bandeau de la ligne de facture */}
                                            <TableRow className="border-b border-slate-100 bg-slate-100/70 hover:bg-slate-100/70 dark:border-neutral-800 dark:bg-neutral-900">
                                                <TableCell
                                                    colSpan={5}
                                                    className="py-2 pl-6"
                                                >
                                                    <div className="flex w-full items-center justify-between gap-4">
                                                        <div className="flex w-full items-center justify-around gap-2">
                                                            <Badge
                                                                variant="secondary"
                                                                className="flex items-center gap-1.5 border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-600 uppercase dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                                                            >
                                                                <Ship className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                                {item.boat
                                                                    ?.name ||
                                                                    'Sans bateau'}
                                                            </Badge>

                                                            <span className="text-xs font-black tracking-wide text-slate-900 uppercase dark:text-neutral-100">
                                                                {item.item
                                                                    ?.name ||
                                                                    'Article'}
                                                            </span>

                                                            <span className="text-[12px] font-medium text-slate-600 uppercase dark:text-neutral-400">
                                                                {
                                                                    item.unit_count
                                                                }{' '}
                                                                {item.unit}{' '}
                                                                <span className="lowercase">
                                                                    x{' '}
                                                                </span>
                                                                {
                                                                    item.unit_price
                                                                }{' '}
                                                                DH
                                                            </span>
                                                        </div>

                                                        <span
                                                            className={cn(
                                                                'rounded border px-2 py-0.5 text-[10px] font-bold',
                                                                remaining <= 0
                                                                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-400'
                                                                    : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400',
                                                            )}
                                                        >
                                                            {remaining <= 0
                                                                ? 'TERMINÉ'
                                                                : `RESTE: ${remaining} ${item.unit ?? ''}`}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {differences.map((difference) => {
                                                const assigned =
                                                    difference.sale_items ?? [];
                                                const unallocated = Math.max(
                                                    0,
                                                    Number(
                                                        difference.unit_count,
                                                    ) -
                                                        assigned.reduce(
                                                            (sum, row) =>
                                                                sum +
                                                                Number(
                                                                    row.unit_count,
                                                                ),
                                                            0,
                                                        ),
                                                );

                                                return (
                                                    <Fragment
                                                        key={difference.id}
                                                    >
                                                        {assigned.map(
                                                            (saleItem) => (
                                                                <DifferenceSaleRow
                                                                    key={
                                                                        saleItem.id
                                                                    }
                                                                    difference={
                                                                        difference
                                                                    }
                                                                    sales={
                                                                        sales
                                                                    }
                                                                    saleItem={
                                                                        saleItem
                                                                    }
                                                                    remaining={
                                                                        unallocated
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                        {unallocated > 0 && (
                                                            <DifferenceSaleRow
                                                                key={`${difference.id}-new-${unallocated}`}
                                                                difference={
                                                                    difference
                                                                }
                                                                sales={sales}
                                                                remaining={
                                                                    unallocated
                                                                }
                                                            />
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </Fragment>
                                    );
                                }
                            })}
                            {items.every(
                                (item) => !item.differences?.length,
                            ) && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-6 text-center text-sm text-slate-500 dark:text-neutral-400"
                                    >
                                        Aucune répartition. Ajoutez des lignes
                                        dans le dialogue des différences avant
                                        de vendre.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SaleDialog;
