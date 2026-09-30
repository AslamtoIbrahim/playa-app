import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
    computeInvoiceItemDifferenceTotal,
    formatDifferenceAmount,
} from '@/lib/differences';
import { InvoiceItem } from '@/types/invoice-item';
import { GripVertical } from 'lucide-react';

interface Props {
    items: InvoiceItem[];
}

const InvoiceItemDragOverlay = ({ items }: Props) => {
    return (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white opacity-95 shadow-2xl">
            <Table>
                <TableBody>
                    {items.map((item) => {
                        const differenceTotal =
                            computeInvoiceItemDifferenceTotal(item);

                        const hasDifferences =
                            (item.differences?.length ?? 0) > 0;

                        return (
                            <TableRow
                                key={item.id}
                                className="divide-x divide-slate-100 border-b border-slate-50 bg-white last:border-none hover:bg-white"
                            >
                                {/* Drag Handle */}
                                <TableCell className="w-8 p-0 text-center text-slate-400">
                                    <GripVertical className="mx-auto h-4 w-4" />
                                </TableCell>

                                {/* Drag Handle */}
                                <TableCell className="w-6 p-0 text-center text-slate-400"></TableCell>

                                {/* Bateau */}
                                <TableCell className="min-w-14 py-2 text-xs font-medium">
                                    {item.boat?.name || '-'}
                                </TableCell>

                                {/* Espèce */}
                                <TableCell className="min-w-14 py-2 text-xs text-slate-600">
                                    {item.item?.name || '-'}
                                </TableCell>

                                {/* Qte / NC */}
                                <TableCell className="w-14 py-2 text-center text-xs">
                                    {item.unit_count || 0}
                                </TableCell>

                                {/* Prix Unitaire */}
                                <TableCell className="py-2 text-right">
                                    {Number(item.unit_price)}
                                </TableCell>

                                {/* Unité */}
                                <TableCell className="py-2 text-center text-slate-500">
                                    {item.unit}
                                </TableCell>

                                {/* Poids */}
                                <TableCell className="py-2 text-center text-shadow-sidebar-accent-foreground">
                                    {Number(item.weight)}
                                </TableCell>

                                {/* Caisse */}
                                <TableCell className="w-12 py-2 text-center">
                                    {Number(item.box)}
                                </TableCell>

                                {/* Valeur DH */}
                                <TableCell className="px-6 py-2 text-right text-xs font-bold">
                                    {(
                                        Number(item.unit_count) *
                                        Number(item.unit_price)
                                    ).toLocaleString('fr-FR', {
                                        minimumFractionDigits: 2,
                                    })}
                                </TableCell>

                                {/* Différence */}
                                <TableCell className="w-28 border-l border-slate-100 px-4 py-2 text-right text-xs font-semibold dark:border-neutral-800">
                                    <span
                                        className={
                                            differenceTotal > 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : differenceTotal < 0
                                                  ? 'text-red-600 dark:text-red-400'
                                                  : 'text-slate-400 dark:text-neutral-500'
                                        }
                                    >
                                        {hasDifferences
                                            ? (differenceTotal > 0 ? '+' : '') +
                                              formatDifferenceAmount(
                                                  differenceTotal,
                                              )
                                            : '0.00'}
                                    </span>
                                </TableCell>

                                <TableCell className="w-4"></TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default InvoiceItemDragOverlay;
