import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox'; // Import Shadcn Checkbox
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

                            {/* Real Shadcn Checkbox (Checked by default since it's being dragged) */}
                            {/* <TableCell className="w-10 px-2 text-center">
                                <Checkbox checked={true} className="pointer-events-none" />
                            </TableCell> */}

                            {/* Bateau */}
                            <TableCell className="text-xs font-medium py-2 min-w-[120px]">
                                {item.boat?.name || '-'}
                            </TableCell>

                            {/* Espèce */}
                            <TableCell className="text-xs py-2 text-slate-600 min-w-[120px]">
                                {item.item?.name || '-'}
                            </TableCell>

                            {/* Qte / NC */}
                            <TableCell className="text-center text-xs py-2">
                                {item.unit_count || 0}
                            </TableCell>

                            {/* Prix Unitaire */}
                            <TableCell className="text-right text-xs py-2">
                                {Number(item.unit_price).toFixed(2)}
                            </TableCell>

                            {/* Unité */}
                            <TableCell className="text-center text-[10px] font-bold py-2 text-slate-500">
                                {item.unit}
                            </TableCell>

                            {/* Poids */}
                            <TableCell className="text-center text-xs py-2">
                                {Number(item.weight).toFixed(2)}
                            </TableCell>

                            {/* Valeur DH */}
                            <TableCell className="text-right px-6 text-xs font-bold py-2 text-blue-600">
                                {(Number(item.unit_count) * Number(item.unit_price)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            
                            <TableCell className="w-12"></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default InvoiceItemDragOverlay;