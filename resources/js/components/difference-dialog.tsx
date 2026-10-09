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
import { AlertCircle, Ship } from 'lucide-react';
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
            <DialogContent className="flex max-h-[90vh] w-fit flex-col gap-0 overflow-hidden border border-slate-200 p-0 shadow-lg sm:max-w-4xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 border-b border-slate-300 bg-slate-50/50 p-6 pb-2 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="flex flex-col items-start justify-between gap-4 pr-8">
                        <div className="flex w-full items-center justify-between">
                            <DialogTitle className="text-xl font-semibold text-slate-900 capitalize dark:text-neutral-100">
                                <span className="text-slate-500 dark:text-neutral-400">
                                    Répartition
                                </span>
                                : {item.item?.name}
                            </DialogTitle>

                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors',
                                        remainingCount <= 0
                                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-400'
                                            : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400',
                                    )}
                                >
                                    {remainingCount <= 0
                                        ? 'TERMINÉ'
                                        : `RESTE: ${remainingCount}`}
                                    {remainingCount < 0 && (
                                        <AlertCircle className="h-3.5 w-3.5" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full items-center justify-between">
                            <Badge
                                variant="secondary"
                                className="flex items-center gap-1.5 border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                            >
                                <Ship className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-[12px] font-bold tracking-wide uppercase">
                                    {item.boat?.name}
                                </span>
                            </Badge>
                        </div>

                        <div className="flex w-full flex-wrap justify-around items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-neutral-400">
                            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                                Quantité:{' '}
                                <strong className="rounded bg-slate-50 px-2 py-0.5 text-sm whitespace-nowrap text-slate-900 dark:bg-neutral-900 dark:text-neutral-200">
                                    {item.unit_count} {item.unit}
                                </strong>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                                P.U:{' '}
                                <strong className="rounded bg-blue-50 px-2 py-0.5 text-sm whitespace-nowrap text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                    {item.unit_price} DH
                                </strong>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                                Total Diff:{' '}
                                <strong
                                    className={cn(
                                        'rounded px-2 py-0.5 text-sm whitespace-nowrap',
                                        totalDiffSum >= 0
                                            ? 'bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400'
                                            : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400',
                                    )}
                                >
                                    {formatDifferenceAmount(totalDiffSum)} DH
                                </strong>
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto dark:bg-neutral-950">
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
