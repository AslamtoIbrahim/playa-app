import { TableCell, TableRow } from '@/components/ui/table';
import { SaleItem } from '@/types/sale-item';

export function SaleShowItemRow({ item }: { item: SaleItem }) {
    return (
        <TableRow>
            <TableCell>
                {item.boat?.name ?? item.invoice_item?.boat?.name ?? '—'}
            </TableCell>
            <TableCell>
                {item.item?.name ?? item.invoice_item?.category?.name ?? '—'}
            </TableCell>
            <TableCell className="text-right">
                {Number(item.unit_count).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell className="text-right">
                {Number(item.sale_price).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell className="text-right">
                {Number(item.real_price).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell className="text-right">
                {Math.abs(Number(item.amount)).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell className="text-right">
                {Number(item.tax).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell className="text-center">
                {item.is_with_tax ? 'Oui' : 'Non'}
            </TableCell>
            <TableCell className="text-right">
                {Number(item.total_diff).toLocaleString('fr-FR')}
            </TableCell>
        </TableRow>
    );
}

export default SaleShowItemRow;
