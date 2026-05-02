import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { SaleItem } from '@/types/sale-item';
import { GripVertical } from 'lucide-react';

interface Props {
    items: SaleItem[];
}

const SaleItemDragOverlay = ({ items }: Props) => {
    return (
        <div className="bg-white shadow-2xl rounded-md overflow-hidden border border-slate-200 opacity-95">
            <Table>
                <TableBody>
                    {items.map((item) => {
                        {
                            const totalAmount = Number(item.unit_count) * Number(item.unit_price);

                            return (
                                <TableRow 
                                    key={item.id} 
                                    className="bg-white divide-x divide-slate-100 border-b border-slate-50 last:border-none hover:bg-white"
                                >
                                    {/* Drag Handle Dummy */}
                                    <TableCell className="w-8 p-0 text-center text-slate-400">
                                        <GripVertical className="h-4 w-4 mx-auto" />
                                    </TableCell>

                                    {/* Checkbox Placeholder */}
                                    <TableCell className="w-8 p-0">
                                        
                                    </TableCell>

                                    {/* Bateau */}
                                    <TableCell className="text-xs font-medium py-2 min-w-45">
                                        {item.boat?.name || '-'}
                                    </TableCell>

                                    {/* Espèce */}
                                    <TableCell className="text-xs py-2 text-slate-600 min-w-45">
                                        {item.item?.name || '-'}
                                    </TableCell>

                                    {/* Qte / NC */}
                                    <TableCell className="w-20 text-center text-xs py-2 font-bold">
                                        {item.unit_count || 0}
                                    </TableCell>

                                    {/* Prix Unitaire */}
                                    <TableCell className="w-28 text-right text-xs py-2 pr-4">
                                        {Number(item.unit_price).toFixed(2)}
                                    </TableCell>

                                    {/* Unité */}
                                    <TableCell className="w-24 text-center text-[10px] font-bold py-2 text-slate-500 uppercase">
                                        {item.unit}
                                    </TableCell>

                                    {/* Poids */}
                                    <TableCell className="w-24 text-center text-xs py-2 text-slate-500">
                                        {Number(item.weight).toFixed(2)}
                                    </TableCell>

                                    {/* Caisses */}
                                    <TableCell className="w-24 text-center text-xs py-2 text-slate-500">
                                        {Number(item.box)}
                                    </TableCell>


                                    {/* Valeur DH */}
                                    <TableCell className="w-32 text-right px-6 text-xs font-bold py-2 text-blue-600">
                                        {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    
                                    {/* Actions Placeholder */}
                                    <TableCell className="w-12"></TableCell>
                                </TableRow>
                            );
                        }
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default SaleItemDragOverlay;