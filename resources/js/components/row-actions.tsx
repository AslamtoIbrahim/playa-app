import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { store, destroy } from "@/routes/invoices/items"; // تأكدت من إضافة destroy هنا
import { InvoiceItem } from "@/types/invoice-item";
import { router } from "@inertiajs/react";
import { ArrowDownToLine, ArrowUpToLine, Copy, MoreVertical, Scale, Trash2 } from "lucide-react";

interface RowActionsProps {
    invoiceId: number;
    item: InvoiceItem;
    data: any;
    onOpenDifference: (item: InvoiceItem) => void; // إضافة prop لفتح الـ Dialog
}

export function RowActions({ invoiceId, item, data, onOpenDifference }: RowActionsProps) {

    const handleAddRow = (direction: 'above' | 'below', duplicate: boolean = false) => {
        router.post(store(invoiceId), {
            ...(duplicate ? data : {
                boat_id: null,
                item_id: null,
                unit_count: 0,
                unit_price: 0,
                weight: 0,
                unit: "caisse"
            }),
            target_id: item.id,
            direction: direction,
        }, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        router.delete(destroy([invoiceId, item.id]), {
            preserveScroll: true,
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="w-full h-10 flex items-center justify-center cursor-pointer text-slate-300 hover:text-slate-600 transition-colors focus:outline-none">
                    <MoreVertical className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => onOpenDifference(item)} className="cursor-pointer text-xs font-medium text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                    <Scale className="mr-2 h-4 w-4" />
                    Répartition (Difference)
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleAddRow('above')} className="cursor-pointer text-xs">
                    <ArrowUpToLine className="mr-2 h-4 w-4 text-slate-400" />
                    Ajouter un vide au-dessus
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleAddRow('below')} className="cursor-pointer text-xs">
                    <ArrowDownToLine className="mr-2 h-4 w-4 text-slate-400" />
                    Ajouter un vide en-dessous
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleAddRow('below', true)} className="cursor-pointer text-xs">
                    <Copy className="mr-2 h-4 w-4 text-slate-400" />
                    Dupliquer la ligne
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 cursor-pointer text-xs focus:text-red-600 focus:bg-red-50"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}