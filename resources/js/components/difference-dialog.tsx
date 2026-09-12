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
import { Customer } from '@/types/customer';
import { Difference } from '@/types/difference';
import { InvoiceItem } from '@/types/invoice-item';
import { Item } from '@/types/item';
import { AlertCircle, CircleDollarSign, Dot, Ship } from 'lucide-react'; // زدت Percent icon
import { useMemo, useState } from 'react'; // زدت useState
import { CommissionRow } from './commission-row'; // import ديالنا الجديد
import { DifferenceRow } from './difference-row';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InvoiceItem;
    customers: Customer[];
    items: Item[];
    sessionZoneId: number;
    date: string;
}

export function DifferenceDialog({
    open,
    onOpenChange,
    item,
    customers,
    items,
    sessionZoneId,
    date,
}: Props) {
    const [showCommission, setShowCommission] = useState(false);

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

    const totalDiffSum = useMemo((): number => {
        {
            const diffsSum = differences.reduce((sum, d) => {
                {
                    return sum + (Number(d.total_diff) || 0);
                }
            }, 0);

            const commissionsSum = (item.receipt_items || [])
                .filter((ri) => ri.type === 'commission')
                .reduce((sum, c) => {
                    {
                        return (
                            sum +
                            (Number(c.unit_count) * Number(c.real_price) || 0)
                        );
                    }
                }, 0);

            return diffsSum - commissionsSum;
        }
    }, [differences, item.receipt_items]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-500 flex-col gap-0 overflow-hidden border border-slate-200 p-0 shadow-lg dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
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
                            {/* ... (Badge and info section remains same) */}
                            <Badge
                                variant="secondary"
                                className="flex items-center gap-1.5 border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                            >
                                <Ship className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-[12px] font-bold tracking-wide uppercase">
                                    {item.boat?.name}
                                </span>
                            </Badge>

                            {/* زر لإظهار سطر الكوميسيون */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    {
                                        setShowCommission(!showCommission);
                                    }
                                }}
                                className={cn(
                                    'h-8 gap-1.5 self-end text-xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800',
                                    showCommission
                                        ? 'border-emerald-200 bg-white text-red-500 dark:border-emerald-900 dark:bg-neutral-900 dark:text-red-400'
                                        : '',
                                )}
                            >
                                <CircleDollarSign className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            </Button>
                        </div>

                        <div className="flex w-full items-center justify-between text-sm text-slate-500 dark:text-neutral-400">
                            <span>
                                Quantité:{' '}
                                <strong className="rounded bg-slate-50 px-2 py-0.5 text-sm text-slate-900 dark:bg-neutral-900 dark:text-neutral-200">
                                    {item.unit_count} {item.unit}
                                </strong>
                            </span>
                            <Dot />
                            <span>
                                P.U:{' '}
                                <strong className="rounded bg-blue-50 px-2 py-0.5 text-sm text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                    {item.unit_price} DH
                                </strong>
                            </span>
                            <Dot />
                            <span className="flex items-center gap-1">
                                Total Diff:
                                <strong
                                    className={cn(
                                        'rounded px-2 py-0.5 text-sm',
                                        totalDiffSum >= 0
                                            ? 'bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400'
                                            : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400',
                                    )}
                                >
                                    {totalDiffSum} DH
                                </strong>
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto dark:bg-neutral-950">
                    <Table className="w-full table-fixed border-collapse">
                        <TableHeader className="sticky top-0 z-20 bg-slate-50/80 shadow-sm backdrop-blur-sm dark:bg-neutral-900/90 dark:border-neutral-800">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-[22%] py-4 pl-6 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client / Bénéf.
                                </TableHead>
                                <TableHead className="w-[18%] py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Article
                                </TableHead>
                                <TableHead className="w-[12%] text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Qté
                                </TableHead>
                                <TableHead className="w-[12%] text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    P.R / P.Comm
                                </TableHead>
                                <TableHead className="w-[14%] text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Diff Total
                                </TableHead>
                                <TableHead className="w-[5%]"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody key={differences.length}>
                            {/* سطر الكوميسيون الجديد (كيظهر غير إلا بركنا على الزر) */}
                            {showCommission && (
                                <CommissionRow
                                    beneficiaries={customers}
                                    invoiceItemId={item.id}
                                    sessionZoneId={sessionZoneId}
                                    date={date}
                                    onSuccess={() => {
                                        {
                                            setShowCommission(false);
                                        }
                                    }}
                                />
                            )}

                            {item.receipt_items
                                ?.filter((ri) => ri.type === 'commission')
                                .map((comm) => (
                                    <CommissionRow
                                        key={`comm-${comm.id}`}
                                        commission={comm} // هنا كندوزو الـ Object كامل
                                        beneficiaries={customers}
                                        invoiceItemId={item.id}
                                        sessionZoneId={sessionZoneId}
                                        date={date}
                                    />
                                ))}

                            {remainingCount > 0 && (
                                <DifferenceRow
                                    isNew
                                    invoiceItemId={item.id}
                                    customers={customers}
                                    items={items}
                                    maxAvailable={remainingCount}
                                    defaultCustomerId={item.boat?.owner_id}
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
