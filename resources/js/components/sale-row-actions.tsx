import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Wayfinder functions
import { store, destroy } from "@/routes/sales/items";

// Types & Logic
import { SaleItem } from "@/types/sale-item";
import { router } from "@inertiajs/react";
import { ArrowDownToLine, ArrowUpToLine, Copy, MoreVertical, Trash2 } from "lucide-react";

interface SaleRowActionsProps {
    saleId: number;
    item: SaleItem;
    data: any;
}

export function SaleRowActions({ saleId, item, data }: SaleRowActionsProps) {

    const handleAddRow = (direction: 'above' | 'below', duplicate: boolean = false) => {
        router.post(store(saleId), {
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
        router.delete(destroy([saleId, item.id]), {
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
                <DropdownMenuItem
                    onClick={() => { return handleAddRow('above'); }}
                    className="cursor-pointer text-xs"
                >
                    <ArrowUpToLine className="mr-2 h-4 w-4 text-slate-400" />
                    Ajouter un vide au-dessus
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => { return handleAddRow('below'); }}
                    className="cursor-pointer text-xs"
                >
                    <ArrowDownToLine className="mr-2 h-4 w-4 text-slate-400" />
                    Ajouter un vide en-dessous
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => { return handleAddRow('below', true); }}
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