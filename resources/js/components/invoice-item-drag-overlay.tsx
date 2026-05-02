import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { InvoiceItem } from '@/types/invoice-item';
import { GripVertical } from 'lucide-react';

interface Props {
    items: InvoiceItem[];
}

const InvoiceItemDragOverlay = ({ items }: Props) => {
    return (
        <div className="bg-white shadow-2xl rounded-md overflow-hidden border border-slate-200 opacity-95">
            <Table>
                <TableBody>
                    {items.map((item) => (
                        <TableRow 
                            key={item.id} 
                            className="bg-white divide-x divide-slate-100 border-b border-slate-50 last:border-none hover:bg-white"
                        >
                            {/* Drag Handle */}
                            <TableCell className="w-8 p-0 text-center text-slate-400">
                                <GripVertical className="h-4 w-4 mx-auto" />
                            </TableCell>

                            {/* Drag Handle */}
                            <TableCell className="w-6 p-0 text-center text-slate-400">
                            </TableCell>

                            {/* Bateau */}
                            <TableCell className="text-xs font-medium py-2 min-w-14">
                                {item.boat?.name || '-'}
                            </TableCell>

                            {/* Espèce */}
                            <TableCell className="text-xs py-2 text-slate-600 min-w-14">
                                {item.item?.name || '-'}
                            </TableCell>

                            {/* Qte / NC */}
                            <TableCell className="text-center w-14 text-xs py-2">
                                {item.unit_count || 0}
                            </TableCell>

                            {/* Prix Unitaire */}
                            <TableCell className="text-right py-2">
                                {Number(item.unit_price)}
                            </TableCell>

                            {/* Unité */}
                            <TableCell className="text-center  py-2 text-slate-500">
                                {item.unit}
                            </TableCell>

                            {/* Poids */}
                            <TableCell className="text-shadow-sidebar-accent-foreground text-center py-2">
                                {Number(item.weight)}
                            </TableCell>

                            {/* Caisse */}
                            <TableCell className="text-center py-2 w-12">
                                {Number(item.box)}
                            </TableCell>

                            {/* Valeur DH */}
                            <TableCell className="text-right px-6 text-xs font-bold py-2 ">
                                {(Number(item.unit_count) * Number(item.unit_price)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            
                            <TableCell className="w-4"></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default InvoiceItemDragOverlay;