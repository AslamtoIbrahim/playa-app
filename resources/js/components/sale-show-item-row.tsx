import { TableCell, TableRow } from '@/components/ui/table';
import type { SalesShowSelectionField } from '@/hooks/use-sales-show-cell-selection';
import type { ComponentProps } from 'react';
import type { SaleItem } from '@/types/sale-item';

interface Props {
    item: SaleItem;
    selectedCell: string | null;
    getSelectionCellProps: (
        rowId: number,
        field: SalesShowSelectionField,
        selectedCell: string | null,
    ) => ComponentProps<typeof TableCell>;
}

export function SaleShowItemRow({
    item,
    selectedCell,
    getSelectionCellProps,
}: Props) {
    return (
        <TableRow>
            <TableCell
                {...getSelectionCellProps(item.id, 'boat', selectedCell)}
            >
                {item.boat?.name ?? item.invoice_item?.boat?.name ?? '—'}
            </TableCell>
            <TableCell
                {...getSelectionCellProps(item.id, 'item', selectedCell)}
            >
                {item.item?.name ?? item.invoice_item?.category?.name ?? '—'}
            </TableCell>
            <TableCell
                {...getSelectionCellProps(item.id, 'quantity', selectedCell)}
                className="text-center"
            >
                {Number(item.unit_count).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell
                {...getSelectionCellProps(item.id, 'sale_price', selectedCell)}
                className="text-center"
            >
                {Number(item.sale_price).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell
                {...getSelectionCellProps(item.id, 'real_price', selectedCell)}
                className="text-center"
            >
                {Number(item.real_price).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell
                {...getSelectionCellProps(item.id, 'amount', selectedCell)}
                className="text-center"
            >
                {Number(item.amount).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell
                {...getSelectionCellProps(item.id, 'tax', selectedCell)}
                className="text-center"
            >
                {Number(item.tax).toLocaleString('fr-FR')}
            </TableCell>
            <TableCell
                {...getSelectionCellProps(item.id, 'total_diff', selectedCell)}
                className="text-center"
            >
                {Number(item.total_diff).toLocaleString('fr-FR')}
            </TableCell>
        </TableRow>
    );
}

export default SaleShowItemRow;
