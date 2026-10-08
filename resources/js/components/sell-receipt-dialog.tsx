import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody } from '@/components/ui/table';
import { computeReceiptRemainingAmount } from '@/lib/sales';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types/customer';
import type { DailySession } from '@/types/daily-session';
import type { Receipt } from '@/types/receipt';
import type { Sale } from '@/types/sale';
import { ShoppingCart } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import MissingDialogSale from './missing-dialog-sale';
import { SaleChargeRow } from './sale-charge-row';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface Props {
    receipt: Receipt;
    sales: Sale[];
    session: DailySession | null;
    customers: Customer[];
    trigger?: React.ReactNode;
}

export function SellReceiptDialog({
    receipt,
    sales,
    session,
    customers,
    trigger,
}: Props) {
    const [open, setOpen] = useState(false);
    const silentSaveCount = useRef<number>(0);
    const charges = receipt.sale_charges ?? [];

    const remaining = useMemo((): number => {
        {
            return computeReceiptRemainingAmount(receipt);
        }
    }, [receipt]);

    const handleSilentSave = (): void => {
        silentSaveCount.current += 1;
    };

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen && silentSaveCount.current > 0) {
            const count = silentSaveCount.current;

            silentSaveCount.current = 0;

            toast.success(
                count > 1
                    ? `${count} imputations mises à jour`
                    : 'Imputation mise à jour',
            );
        }

        setOpen(nextOpen);
    };

    const hasNoSale = sales.length === 0;
    const canCreateSale = session !== null && customers.length > 0;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                {trigger ?? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                    >
                        <ShoppingCart className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="border-b p-6 pb-3">
                    <div className="flex w-full items-center justify-between pr-8">
                        <DialogTitle>{`Vendre le bon #${receipt.id}`}</DialogTitle>

                        <div
                            className={cn(
                                'rounded-md border px-3 py-1.5 text-xs font-bold',
                                remaining <= 0
                                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-400'
                                    : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400',
                            )}
                        >
                            {remaining <= 0
                                ? 'TERMINÉ'
                                : `RESTE: ${Number(remaining).toLocaleString('fr-FR')} DH`}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary">
                            {receipt.boat?.name ||
                                receipt.customer?.name ||
                                '—'}
                        </Badge>
                        <span>{`Total : ${Number(receipt.total_amount).toLocaleString('fr-FR')} DH`}</span>
                    </div>

                    {hasNoSale && canCreateSale && (
                        <div className="flex w-full items-center gap-2">
                            <div className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-xs">
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
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    <Table>
                        <TableBody>
                            {remaining > 0 && (
                                <SaleChargeRow
                                    isNew
                                    receiptId={receipt.id}
                                    sales={sales}
                                    excludedSaleIds={charges.map(
                                        (charge) => charge.sale_id,
                                    )}
                                    maxAvailable={remaining}
                                    onSilentSave={handleSilentSave}
                                    session={session}
                                    customers={customers}
                                />
                            )}

                            {charges.map((charge) => {
                                {
                                    return (
                                        <SaleChargeRow
                                            key={charge.id}
                                            saleCharge={charge}
                                            receiptId={receipt.id}
                                            sales={sales}
                                            maxAvailable={
                                                remaining +
                                                Number(charge.amount)
                                            }
                                            onSilentSave={handleSilentSave}
                                            session={session}
                                            customers={customers}
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

export default SellReceiptDialog;
