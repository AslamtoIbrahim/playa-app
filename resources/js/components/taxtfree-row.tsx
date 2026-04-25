import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { useTaxFreeRow } from "@/hooks/use-tax-free-row";
import { Difference } from "@/types/difference";
import { Check, Loader2, Trash2 } from 'lucide-react';

interface RowProps {
    diff: Difference;
    customerId: number; // Ghadi n-khlliwha hna bach types ikouno match
}

export function TaxFreeRow({ diff }: RowProps) {
    const {
        data,
        handleDataChange,
        loading,
        handleDelete,
        submitSave,
    } = useTaxFreeRow({
        diff,
        isNew: false,
        maxAvailable: 999999,
    });

    const inputClass = "h-9 border-slate-200 bg-white text-center focus-visible:ring-1 focus-visible:ring-blue-400 transition-all [appearance:textfield]";
    const amount = (Number(data.unit_count) * Number(data.real_price)) || 0;

    return (
        <TableRow className="group hover:bg-slate-50/50">
            {/* Article */}
            <TableCell className="font-medium text-slate-700">
                {diff.invoice_item?.item?.name || 'Article'}
            </TableCell>

            {/* Quantité */}
            <TableCell className="p-2">
                <Input
                    value={data.unit_count}
                    onChange={(e) => handleDataChange({ unit_count: e.target.value })}
                    onBlur={() => submitSave()}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            {/* Prix Réel */}
            <TableCell className="p-2">
                <Input
                    value={data.real_price}
                    onChange={(e) => handleDataChange({ real_price: e.target.value })}
                    onBlur={() => submitSave()}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            {/* Amount */}
            <TableCell className="text-center font-bold text-blue-600 tabular-nums">
                {amount.toLocaleString()}
            </TableCell>

            {/* Boxes */}
            <TableCell className="p-2">
                <Input
                    value={data.boxes}
                    onChange={(e) => handleDataChange({ boxes: e.target.value })}
                    onBlur={() => submitSave()}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            {/* Actions */}
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : (
                        <>
                            <Check className="h-4 w-4 text-green-500 opacity-50" />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleDelete}
                                className="h-7 w-7 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}