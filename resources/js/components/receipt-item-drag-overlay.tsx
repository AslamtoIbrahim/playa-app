import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ReceiptItem } from '@/types/receipt-item';
import { GripVertical } from 'lucide-react';

interface Props {
    items: ReceiptItem[];
}

const ReceiptItemDragOverlay = ({ items }: Props) => {
    return (
        <div className="bg-white shadow-2xl rounded-md overflow-hidden border border-slate-200 opacity-90 scale-[1.02] cursor-grabbing">
            <Table>
                <TableBody>
                    {items.map((item) => (
                        <TableRow 
                            key={item.id} 
                            className="bg-white divide-x divide-slate-100 border-b border-slate-50 last:border-none"
                        >
                            {/* Drag Handle - Indicating movement */}
                            <TableCell className="w-10 p-0 text-center text-blue-500 bg-blue-50/50">
                                <GripVertical className="h-4 w-4 mx-auto" />
                            </TableCell>

                             {/* Box (Caisses) */}
                            <TableCell className="text-center text-xs py-3 w-20">
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-center font-medium">
                                    {item.box || 0}
                                </span>
                            </TableCell>

                            {/* Species (Item) */}
                            <TableCell className="text-xs font-medium py-3 min-w-37.5 text-slate-400 italic">
                                {item.item?.name || 'Saisir espèce...'}
                            </TableCell>

                            {/* Quantité (Poids) */}
                            <TableCell className="text-center text-xs py-3 w-24">
                                <span className="text-slate-600 font-medium">
                                    {Number(item.unit_count).toFixed(2)}
                                </span>
                            </TableCell>

                           

                            {/* Prix Unitaire */}
                            <TableCell className="text-right text-xs py-3 w-28 font-medium">
                                {Number(item.real_price).toFixed(2)}
                            </TableCell>

                            {/* Valeur Totale */}
                            <TableCell className="text-right px-6 text-xs font-bold py-3  text-slate-900 min-w-30">
                                {(Number(item.unit_count) * Number(item.real_price)).toLocaleString('fr-FR', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2 
                                })}
                            </TableCell>
                            
                            {/* Actions Placeholder to maintain layout width */}
                            <TableCell className="w-12 px-2"></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ReceiptItemDragOverlay;