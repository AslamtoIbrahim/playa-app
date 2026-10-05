import { TableCell, TableRow } from '@/components/ui/table';
import { formatDifferenceAmount } from '@/lib/differences';
import { cn } from '@/lib/utils';
import { SaleItem } from '@/types/sale-item';

interface Props {
    /** Ligne de distribution : la donnée affichée est déduite de la facture d'achat d'origine. */
    item: SaleItem;
}

/**
 * Ligne en lecture seule de la fiche d'une vente.
 *
 * La vente est alimentée depuis les lignes de facture d'achat : la ligne affiche
 * donc le bateau et l'article de la facture d'origine, la quantité vendue, le prix
 * réel pratiqué, le prix unitaire de la facture, l'écart en résultant et la
 * valeur de la vente. Les montants sont alignés à droite comme sur la fiche
 * facture, la dernière colonne (l'écart) étant isolée par un filet.
 */
export function SaleShowItemRow({ item }: Props) {
    const invoiceItem = item.invoice_item;

    const value = Number(item.unit_count) * Number(item.real_price);

    const diff = Number(item.total_diff);

    return (
        <TableRow className="h-12 border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-neutral-800 dark:hover:bg-neutral-900/40">
            <TableCell className="border-r border-slate-100 px-4 text-sm font-semibold text-slate-900 capitalize dark:border-neutral-800 dark:text-neutral-100">
                {invoiceItem?.boat?.name || '—'}
            </TableCell>

            <TableCell className="border-r border-slate-100 px-4 text-sm font-medium text-slate-700 capitalize dark:border-neutral-800 dark:text-neutral-200">
                {invoiceItem?.item?.name || 'Article'}
            </TableCell>

            <TableCell className="w-24 border-r border-slate-100 text-center text-sm font-bold text-slate-900 dark:border-neutral-800 dark:text-neutral-100">
                {item.unit_count}{' '}
                <span className="text-[10px] font-normal text-slate-500 uppercase dark:text-neutral-400">
                    {invoiceItem?.unit}
                </span>
            </TableCell>

            <TableCell className="w-32 border-r border-slate-100 px-4 text-right text-sm font-medium text-slate-700 dark:border-neutral-800 dark:text-neutral-200">
                {Number(item.real_price).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                })}
            </TableCell>

            <TableCell className="w-32 border-r border-slate-100 px-4 text-right text-sm text-slate-500 dark:border-neutral-800 dark:text-neutral-400">
                {invoiceItem
                    ? Number(invoiceItem.unit_price).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                      })
                    : '—'}
            </TableCell>

            <TableCell className="w-36 border-r border-slate-100 bg-slate-50/10 px-6 text-right text-sm font-bold text-slate-900 dark:border-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-100">
                {value.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                })}
            </TableCell>

            <TableCell
                className={cn(
                    'w-32 border-l border-slate-100 bg-slate-50/10 px-6 text-right text-sm font-bold dark:border-neutral-800 dark:bg-neutral-900/20',
                    diff < 0
                        ? 'text-red-600 dark:text-red-400'
                        : diff > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-slate-600 dark:text-neutral-300',
                )}
            >
                {(diff > 0 ? '+' : '') + formatDifferenceAmount(diff)}
            </TableCell>
        </TableRow>
    );
}

export default SaleShowItemRow;
