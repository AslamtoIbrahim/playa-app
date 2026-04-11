import { Head } from '@inertiajs/react';
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // زدنا هادو

// Components
import AddInvoiceDialog from '@/components/add-invoice-dialog';
import InvoiceActions from '@/components/invoice-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

// Types
import type { Account } from '@/types/accounts';
import type { Invoice } from '@/types/invoice';
import type { OfficeRoom } from '@/types/office-room';

interface Props {
    invoices: {
        data: Invoice[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    accounts: Account[];
    officeRooms: OfficeRoom[];
}

const statusStyles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
    unpaid: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm',
    pending: 'bg-slate-50 text-slate-600 border-slate-200 border-dashed',
};

export default function Invoices({ invoices, accounts, officeRooms }: Props) {
    return (
        <>
            <Head title="Factures" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Factures</h1>
                        <p className="text-sm font-medium text-muted-foreground">Gestion et suivi de la facturation client.</p>
                    </div>
                    <AddInvoiceDialog accounts={accounts} officeRooms={officeRooms} />
                </div>

                {/* Table Card */}
                <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-b border-slate-200 text-sm">
                                <TableHead className="w-[100px] font-bold text-slate-800">N°</TableHead>
                                <TableHead className="font-bold text-slate-800">Date</TableHead>
                                <TableHead className="font-bold text-slate-800">Ville</TableHead>
                                <TableHead className="font-bold text-slate-800">Compte</TableHead>
                                <TableHead className="text-center font-bold text-slate-800">NC</TableHead>
                                <TableHead className="text-center font-bold text-slate-800">Poids (KG)</TableHead>
                                <TableHead className="text-right font-bold text-slate-800">Net à Payer</TableHead>
                                <TableHead className="font-bold text-slate-800">Statut</TableHead>
                                <TableHead className="text-right font-bold text-emerald-700 uppercase text-[10px] tracking-wider leading-none pt-4">Payé (DH)</TableHead>
                                <TableHead className="w-[50px]"></TableHead> 
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.data.length > 0 ? (
                                invoices.data.map((invoice) => (
                                    <TableRow key={invoice.id} className="group hover:bg-slate-50/80 transition-all border-b border-slate-100 last:border-0">
                                        <TableCell className="font-mono text-sm font-bold text-blue-700">
                                            {invoice.invoice_number}
                                        </TableCell>

                                        <TableCell className="text-sm text-slate-600 font-medium">
                                            {format(new Date(invoice.date), 'dd/MM/yyyy')}
                                        </TableCell>
                                        
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                                                {(invoice as any).office_room?.city || '-'}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="font-semibold text-slate-700 text-sm max-w-[180px] truncate">
                                            {invoice.account?.name || '---'}
                                        </TableCell>

                                        <TableCell className="text-center font-bold text-slate-700">
                                            {invoice.boxes || 0}
                                        </TableCell>

                                        <TableCell className="text-center text-sm font-medium text-slate-500">
                                            {invoice.weight && invoice.weight > 0 ? invoice.weight : '-'}
                                        </TableCell>

                                        <TableCell className="font-black text-right text-slate-900 bg-slate-50/30 text-base">
                                            {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(invoice.amount)}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "capitalize shadow-none text-[10px] font-bold px-2.5 py-0.5 border rounded-full", 
                                                    statusStyles[invoice.status]
                                                )}
                                            >
                                                {invoice.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="font-bold text-right text-emerald-600 text-sm">
                                            {new Intl.NumberFormat('fr-FR').format(invoice.total_paid || (invoice as any).payments_sum_amount || 0)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <InvoiceActions invoice={invoice} accounts={accounts} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-24 text-muted-foreground font-medium italic">
                                        Aucune facture enregistrée pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Pro Logic */}
                    <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {invoices.total} Factures au total
                        </div>
                        <div className="flex gap-2">
                            {invoices.links.map((link, i) => {
                                // Logic to replace &laquo; Previous and Next &raquo;
                                const isPrevious = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');
                                
                                return (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "h-9 min-w-[36px] font-bold text-xs transition-all shadow-none", 
                                            !link.url && "opacity-40 cursor-not-allowed pointer-events-none",
                                            link.active && "shadow-md scale-105"
                                        )}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <a href={link.url}>
                                                {isPrevious ? <ChevronLeft className="w-4 h-4" /> : isNext ? <ChevronRight className="w-4 h-4" /> : link.label}
                                            </a>
                                        ) : (
                                            <span>
                                                {isPrevious ? <ChevronLeft className="w-4 h-4" /> : isNext ? <ChevronRight className="w-4 h-4" /> : link.label}
                                            </span>
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Invoices.layout = (page: any) => ({
    children: page,
    breadcrumbs: [{ title: 'Factures', href: '/invoices' }],
});