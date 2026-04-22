import { MoreHorizontal, Eye, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Link } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { show } from '@/routes/invoices';
import { Invoice, Billable } from '@/types/invoice';

// استيراد الـ Dialogs ديالك
import EditInvoiceDialog from './edit-invoice-dialog';
import DeleteInvoiceDialog from './delete-invoice-dialog';
import AddPaymentDialog from './add-payment-dialog';
import { DailySession } from "@/types/daily-session";

interface Props {
    invoice: Invoice;
    billables: Billable[];
    sessions: DailySession[];
}

export default function InvoiceActions({ invoice, billables, sessions }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 p-1">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1.5">
                    Operations
                </DropdownMenuLabel>

                {/* View Detail */}
                <Link href={show.url(invoice.id)}>
                    <DropdownMenuItem className="cursor-pointer gap-2 text-blue-600 focus:text-blue-700">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">Voir Détails</span>
                    </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                {/* Add Payment */}
                {invoice.status !== 'paid' && (
                    <div onClick={(e) => {
                        e.stopPropagation();
                    }}>
                        <AddPaymentDialog invoice={invoice} trigger={
                            <DropdownMenuItem onSelect={(e) => {
                                e.preventDefault();
                            }} className="cursor-pointer gap-2 text-emerald-600">
                                <PlusCircle className="h-4 w-4" />
                                <span className="font-medium">Ajouter Paiement</span>
                            </DropdownMenuItem>
                        } />
                    </div>
                )}

                {/* Edit */}
                <div onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <EditInvoiceDialog sessions={sessions} invoice={invoice} billables={billables} trigger={
                        <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault();
                        }} className="cursor-pointer gap-2 text-slate-600">
                            <Pencil className="h-4 w-4" />
                            <span className="font-medium">Modifier</span>
                        </DropdownMenuItem>
                    } />
                </div>

                <DropdownMenuSeparator />

                {/* Delete */}
                <div onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <DeleteInvoiceDialog
                        amount={invoice.amount}
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => {
                                e.preventDefault();
                            }} className="cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-700">
                                <Trash2 className="h-4 w-4" />
                                <span className="font-medium">Supprimer</span>
                            </DropdownMenuItem>
                        }
                    />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}