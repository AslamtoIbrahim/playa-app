import { Card, CardContent } from '@/components/ui/card';
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
                'w-full overflow-hidden border-slate-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
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
                                <TableRow key={charge.id} className="h-11">
                                    <TableCell className="px-4 text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                        {`#${charge.receipt_id}`}
                                    </TableCell>

                                    <TableCell className="px-4 text-sm capitalize text-slate-600 dark:text-neutral-300">
                                        {receipt?.boat?.name ||
                                            receipt?.customer?.name ||
                                            '—'}
                                    </TableCell>

                                    <TableCell className="px-4 text-right text-sm font-bold text-slate-900 dark:text-neutral-100">
                                        {`${Number(charge.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`}
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

