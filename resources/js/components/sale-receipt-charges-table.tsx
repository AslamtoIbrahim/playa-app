import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { SaleCharge } from '@/types/sale-charge';

interface SaleReceiptChargesTableProps {
    charges: SaleCharge[];
    className?: string;
}

/**
 * Receipt vouchers charged to the sale.
 *
 * Compact table without header: only voucher number, origin (boat/supplier)
 * and charged amount. Half-width ready so a second table (workers) can sit
 * side by side.
 */
export function SaleReceiptChargesTable({
    charges,
    className,
}: SaleReceiptChargesTableProps) {
    if (charges.length === 0) {
        return null;
    }

    return (
        <Card
            className={cn(
                'w-full gap-0 overflow-hidden border-slate-200/80 bg-white py-0 shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader className="border-b border-slate-100 bg-linear-to-r from-orange-50/70 to-white px-4 py-3 dark:border-neutral-800 dark:from-orange-950/20 dark:to-neutral-900">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Bons imputés
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <TableRow className="h-10 hover:bg-transparent">
                            <TableHead className="w-20 px-4 text-[10px] font-black uppercase">
                                Bon N°
                            </TableHead>

                            <TableHead className="px-4 text-[10px] font-black uppercase">
                                Bons
                            </TableHead>

                            <TableHead className="w-36 px-4 text-right text-[10px] font-black uppercase">
                                Montant imputé
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {charges.map((charge) => {
                            const receipt = charge.receipt;

                            return (
                                    <TableRow key={charge.id} className="h-11 transition-colors hover:bg-orange-50/40 dark:hover:bg-orange-950/10">
                                    <TableCell className="px-4 text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                        {`#${charge.receipt_id}`}
                                    </TableCell>

                                    <TableCell className="px-4 text-sm capitalize text-slate-600 dark:text-neutral-300">
                                        {receipt?.boat?.name ||
                                            receipt?.customer?.name ||
                                            '—'}
                                    </TableCell>

                                    <TableCell className="px-4 text-right text-sm font-bold tabular-nums text-slate-900 dark:text-neutral-100">
                                        {`${Number(charge.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default SaleReceiptChargesTable;

