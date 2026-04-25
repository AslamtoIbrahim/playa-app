import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { store, destroy } from "@/routes/receipts/items";
import { ReceiptItem } from "@/types/receipt-item";
import { router } from "@inertiajs/react";
import { ArrowDownToLine, ArrowUpToLine, Copy, MoreVertical, Trash2 } from "lucide-react";

interface ReceiptRowActionsProps {
    receiptId: number;
    item: ReceiptItem;
    data: any;
}

export function ReceiptRowActions({ receiptId, item, data }: ReceiptRowActionsProps) {

    const handleAddRow = (direction: 'above' | 'below', duplicate: boolean = false) => {
        const payload = {
            ...(duplicate ? data : {
                item_id: null,
                unit_count: 0,
                real_price: 0,
                box: 0,
            }),
            target_id: item.id,
            direction: direction,
        };

        router.post(store(receiptId), payload, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        router.delete(destroy({ receipt: receiptId, item: item.id }), {
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

            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                    onClick={() => handleAddRow('above')}
                    className="cursor-pointer text-xs"
                >
                    <ArrowUpToLine className="mr-2 h-4 w-4 text-slate-400" />
                    Ajouter au-dessus
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleAddRow('below')}
                    className="cursor-pointer text-xs"
                >
                    <ArrowDownToLine className="mr-2 h-4 w-4 text-slate-400" />
                    Ajouter en-dessous
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => handleAddRow('below', true)}
                    className="cursor-pointer text-xs"
                >
                    <Copy className="mr-2 h-4 w-4 text-slate-400" />
                    Dupliquer la ligne
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 cursor-pointer text-xs focus:text-red-600 focus:bg-red-50"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer la ligne
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}