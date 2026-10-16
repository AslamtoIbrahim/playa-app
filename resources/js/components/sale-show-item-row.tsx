import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SaleItem } from '@/types/sale-item';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function SaleShowItemRow({ item }: { item: SaleItem }) {
    return <TableRow>
        <TableCell>{item.boat?.name ?? item.invoice_item?.boat?.name ?? '—'}</TableCell>
        <TableCell>{item.item?.name ?? item.invoice_item?.item?.name ?? '—'}</TableCell>
        <TableCell className="text-right">{Number(item.unit_count).toLocaleString('fr-FR')}</TableCell>
        <TableCell className="text-right">{Number(item.sale_price).toLocaleString('fr-FR')}</TableCell>
        <TableCell className="text-right">{Number(item.real_price).toLocaleString('fr-FR')}</TableCell>
        <TableCell className="text-right">{Math.abs(Number(item.amount)).toLocaleString('fr-FR')}</TableCell>
        <TableCell className="text-right">{Number(item.tax).toLocaleString('fr-FR')}</TableCell>
        <TableCell className="text-center">{item.is_with_tax ? 'Oui' : 'Non'}</TableCell>
        <TableCell className="text-right">{Number(item.total_diff).toLocaleString('fr-FR')}</TableCell>
        <TableCell className="w-12 p-0 text-center">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Supprimer la ligne de vente"
                className="text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                onClick={() => {
                    router.delete(`/sale-items/${item.id}`, {
                        preserveScroll: true,
                        onSuccess: () => toast.success('Ligne de vente supprimée.'),
                        onError: () => toast.error('Impossible de supprimer cette ligne.'),
                    });
                }}
            >
                <Trash2 className="size-4" />
            </Button>
        </TableCell>
    </TableRow>;
}

export default SaleShowItemRow;
