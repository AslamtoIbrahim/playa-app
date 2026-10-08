import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { SaleCharge } from '@/types/sale-charge';

/**
 * Bons de réception imputés à la vente.
 *
 * Chaque ligne montre le bon d'origine (numéro, date, bateau, client) et le
 * montant de ce bon affecté à la vente courante. Les montants viennent du même
 * `sale.charges` que les statistiques : une seule source de vérité.
 */
export function SaleReceiptChargesTable({
    charges,
}: {
    charges: SaleCharge[];
}) {
    const total = charges.reduce(
        (sum, charge) => sum + Number(charge.amount || 0),
        0,
    );

    if (charges.length === 0) {
        {
            return null;
        }
    }

    return (
        <Card className="overflow-hidden border-slate-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                        {`Bons imputés (${charges.length})`}
                    </CardTitle>

                    <span className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                        {`${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <TableRow className="h-11 hover:bg-transparent">
                            <TableHead className="w-24 px-4 text-[10px] font-black uppercase">
                                Bon N°
                            </TableHead>

                            <TableHead className="w-32 px-4 text-[10px] font-black uppercase">
                                Date
                            </TableHead>

                            <TableHead className="px-4 text-[10px] font-black uppercase">
                                Bateau / Fournisseur
                            </TableHead>

                            <TableHead className="w-32 px-4 text-right text-[10px] font-black uppercase">
                                Total bon
                            </TableHead>

                            <TableHead className="w-36 px-4 text-right text-[10px] font-black uppercase">
                                Montant imputé
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {charges.map((charge) => {
                            {
                                const receipt = charge.receipt;

                                return (
                                    <TableRow key={charge.id} className="h-12">
                                        <TableCell className="px-4 text-sm font-semibold">
                                            {`#${charge.receipt_id}`}
                                        </TableCell>

                                        <TableCell className="px-4 text-sm text-slate-600 dark:text-neutral-300">
                                            {receipt?.date ?? '—'}
                                        </TableCell>

                                        <TableCell className="px-4 text-sm capitalize">
                                            {receipt?.boat?.name ||
                                                receipt?.customer?.name ||
                                                '—'}
                                        </TableCell>

                                        <TableCell className="px-4 text-right text-sm text-slate-500 dark:text-neutral-400">
                                            {receipt
                                                ? Number(
                                                      receipt.total_amount,
                                                  ).toLocaleString('fr-FR', {
                                                      minimumFractionDigits: 2,
                                                  })
                                                : '—'}
                                        </TableCell>

                                        <TableCell className="px-4 text-right text-sm font-bold">
                                            {`${Number(charge.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`}
                                        </TableCell>
                                    </TableRow>
                                );
                            }
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default SaleReceiptChargesTable;
