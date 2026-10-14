import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    computeInvoiceItemDifferenceTotal,
    formatDifferenceAmount,
} from '@/lib/differences';
import { normalizeMorphType } from '@/lib/invoice';
import { Category } from '@/types/category';
import { Customer } from '@/types/customer';
import { Difference } from '@/types/difference';
import { InvoiceItem } from '@/types/invoice-item';
import { Item } from '@/types/item';
import { AlertCircle, ArrowLeftRight, Ship, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { DifferenceRow } from './difference-row';
import { Badge } from './ui/badge';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InvoiceItem;
    customers: Customer[];
    items: Item[];
    categories: Category[];
}

export function DifferenceDialog({
    open,
    onOpenChange,
    item,
    customers,
    items,
    categories,
}: Props) {
    const differences = useMemo((): Difference[] => {
        {
            return item.differences || [];
        }
    }, [item.differences]);

    const totalDistributed = useMemo((): number => {
        {
            return differences.reduce((sum, d) => {
                return sum + Number(d.unit_count);
            }, 0);
        }
    }, [differences]);

    const remainingCount = Number(item.unit_count) - totalDistributed;

    /**
     * Client par défaut de la nouvelle ligne de répartition.
     *
     * Le propriétaire du bateau est polymorphique (client ou société) et les
     * ids des deux tables se chevauchent : sans ce contrôle, un bateau
     * appartenant à une société présélectionnerait le client qui porte le
     * même id (ex. société #1 → client #1). On ne présélectionne donc que
     * lorsque le propriétaire est un client existant, sinon on laisse la
     * cellule vide (les différences référencent la table `customers`).
     */
    const ownerCustomerId = useMemo((): number | undefined => {
        {
            const boat = item.boat;

            if (!boat?.owner_id || !boat.owner_type) {
                {
                    return undefined;
                }
            }

            const isCustomerOwner = normalizeMorphType(
                boat.owner_type,
            ).endsWith('Customer');

            if (!isCustomerOwner) {
                {
                    return undefined;
                }
            }

            const ownerCustomer = customers.find(
                (customer) => Number(customer.id) === Number(boat.owner_id),
            );

            return ownerCustomer?.id;
        }
    }, [item.boat, customers]);

    const totalDiffSum = useMemo((): number => {
        {
            return computeInvoiceItemDifferenceTotal(item);
        }
    }, [item]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-fit max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-indigo-100 p-0 shadow-2xl sm:max-w-4xl dark:border-indigo-950 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 border-b border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 pb-3 sm:p-5 dark:border-indigo-950 dark:from-indigo-950/50 dark:via-neutral-950 dark:to-sky-950/30">
                    <div className="flex flex-col gap-3 pr-8">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 dark:bg-indigo-500">
                                    <ArrowLeftRight className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="mb-1 flex items-center gap-2">
                                        <span className="text-[10px] font-bold tracking-[0.18em] text-indigo-600 uppercase dark:text-indigo-300">
                                            Achat · Répartition
                                        </span>
                                        <span className="h-1 w-1 rounded-full bg-indigo-300" />
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400">
                                            Différences
                                        </span>
                                    </div>
                                    <DialogTitle className="truncate text-xl font-bold text-slate-900 capitalize sm:text-2xl dark:text-neutral-100">
                                        {item.item?.name || 'Article'}
                                    </DialogTitle>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="gap-1.5 border-indigo-100 bg-white/80 text-[10px] font-semibold text-slate-600 dark:border-indigo-900 dark:bg-neutral-900 dark:text-neutral-300"
                                        >
                                            <Ship className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                            {item.boat?.name || 'Sans bateau'}
                                        </Badge>
                                        <span className="text-xs text-slate-500 dark:text-neutral-400">
                                            Prix facturé {item.unit_price} DH /
                                            unité
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div
                                className={cn(
                                    'shrink-0 rounded-xl border px-3 py-2 text-right shadow-sm',
                                    remainingCount <= 0
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                                        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
                                )}
                            >
                                <div className="text-[9px] font-bold tracking-widest uppercase">
                                    {remainingCount <= 0
                                        ? 'Répartition complète'
                                        : 'À répartir'}
                                </div>
                                <div className="mt-0.5 flex items-center justify-end gap-1 text-sm font-black">
                                    {remainingCount <= 0
                                        ? 'TERMINÉ'
                                        : `${remainingCount} ${item.unit ?? ''}`}
                                    {remainingCount < 0 && (
                                        <AlertCircle className="h-3.5 w-3.5" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-xs shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
                            <span className="text-slate-500 dark:text-neutral-400">
                                Qté facture{' '}
                                <strong className="ml-1 text-slate-900 dark:text-neutral-100">
                                    {item.unit_count} {item.unit}
                                </strong>
                            </span>
                            <span className="text-slate-500 dark:text-neutral-400">
                                P.U{' '}
                                <strong className="ml-1 text-indigo-700 dark:text-indigo-300">
                                    {item.unit_price} DH
                                </strong>
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                                <TrendingUp className="h-3 w-3" /> Diff cumulée
                                <strong
                                    className={cn(
                                        'ml-1',
                                        totalDiffSum >= 0
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-rose-600 dark:text-rose-400',
                                    )}
                                >
                                    {totalDiffSum > 0 ? '+' : ''}
                                    {formatDifferenceAmount(totalDiffSum)} DH
                                </strong>
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto bg-slate-50/60 dark:bg-neutral-950">
                    <Table className="w-auto border-collapse">
                        <TableHeader className="sticky top-0 z-20 bg-slate-50/80 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="min-w-40 py-4 pl-6 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client / Bénéf.
                                </TableHead>
                                <TableHead className="min-w-32 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Article
                                </TableHead>
                                <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Qté
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    P.R / P.Comm
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Diff Total
                                </TableHead>
                                <TableHead className="w-15"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody key={differences.length}>
                            {remainingCount > 0 && (
                                <DifferenceRow
                                    isNew
                                    invoiceItemId={item.id}
                                    customers={customers}
                                    items={items}
                                    categories={categories}
                                    maxAvailable={remainingCount}
                                    defaultCustomerId={ownerCustomerId}
                                    defaultItemId={item.item_id}
                                    unitPrice={Number(item.unit_price)}
                                />
                            )}

                            {differences.map((diff) => {
                                {
                                    return (
                                        <DifferenceRow
                                            key={`${item.id}-${diff.id}`}
                                            diff={diff}
                                            customers={customers}
                                            items={items}
                                            categories={categories}
                                            maxAvailable={
                                                remainingCount +
                                                Number(diff.unit_count)
                                            }
                                            defaultCustomerId={diff.customer_id}
                                        />
                                    );
                                }
                            })}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
