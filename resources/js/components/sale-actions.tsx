import { Link } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { show } from '@/routes/sales';
import { Customer } from '@/types/customer';
import { DailySession } from "@/types/daily-session";
import { Sale } from '@/types/sale';

import DeleteSaleDialog from './delete-sale-dialog';
import EditSaleDialog from './edit-sale-dialog';

interface Props {
    sale: Sale;
    customers: Customer[];
    sessions: DailySession[];
}

export default function SaleActions({ sale, customers, sessions }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52 p-1">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1.5">
                    Actions Vente
                </DropdownMenuLabel>

                {/* View Details */}
                <Link href={show.url(sale.id)}>
                    <DropdownMenuItem className="cursor-pointer gap-2 text-blue-600 focus:text-blue-700">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">Voir Détails</span>
                    </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                {/* Edit Sale */}
                <div onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <EditSaleDialog 
                        sale={sale} 
                        customers={customers} 
                        sessions={sessions} 
                        trigger={
                            <DropdownMenuItem 
                                onSelect={(e) => {
                                    e.preventDefault();
                                }} 
                                className="cursor-pointer gap-2 text-slate-600"
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="font-medium">Modifier l'entête</span>
                            </DropdownMenuItem>
                        } 
                    />
                </div>

                <DropdownMenuSeparator />

                {/* Delete Sale */}
                <div onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <DeleteSaleDialog
                        saleId={sale.id}
                        amount={sale.amount}
                        customerName={sale.customer?.name || 'Client Inconnu'}
                        trigger={
                            <DropdownMenuItem 
                                onSelect={(e) => {
                                    e.preventDefault();
                                }} 
                                className="cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="font-medium">Supprimer la vente</span>
                            </DropdownMenuItem>
                        }
                    />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}