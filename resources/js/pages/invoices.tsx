import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

// Components
import AddInvoiceDialog from '@/components/add-invoice-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { show } from '@/routes/invoices';

// Types
import type { Billable, Invoice } from '@/types/invoice';
import type { OfficeRoom } from '@/types/office-room';
import type { DailySession } from '@/types/daily-session'; // تأكد من المسار
import InvoiceActions from '@/components/invoice-actions';

interface Props {
    invoices: {
        data: Invoice[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    billables: Billable[];
    officeRooms: OfficeRoom[];
    sessions: DailySession[]; // زدنا السيسيونات هنا
}

const statusStyles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
    unpaid: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm',
    pending: 'bg-slate-50 text-slate-600 border-slate-200 border-dashed',
};

export default function Invoices({ invoices, billables, officeRooms, sessions }: Props) {
    const handleRowClick = (invoiceId: number) => {
        router.visit(show.url(invoiceId));
    };


    return (
        <>
            <Head title="Factures" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                            Factures
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground">
                            Gestion et suivi de la facturation (Ventes & Achats).
                        </p>
                    </div>

                    <AddInvoiceDialog
                        billables={billables}
                        officeRooms={officeRooms}
                        sessions={sessions}
                    />
                </div>

                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent">
                                <TableHead className="w-24 font-bold text-slate-800">N°</TableHead>
                                <TableHead className="font-bold text-slate-800">Type</TableHead>
                                <TableHead className="font-bold text-slate-800">Date</TableHead>
                                <TableHead className="font-bold text-slate-800">Session</TableHead>
                                <TableHead className="font-bold text-slate-800">Bénéficiaire</TableHead>
                                <TableHead className="text-center font-bold text-slate-800">NC</TableHead>
                                <TableHead className="text-right font-bold text-slate-800">Total (DH)</TableHead>
                                <TableHead className="font-bold text-slate-800 text-center">Statut</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.data.length > 0 ? (
                                invoices.data.map((invoice) => (
                                    <TableRow
                                        key={invoice.id}
                                        onClick={() => handleRowClick(invoice.id)}
                                        className="group cursor-pointer border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-blue-700">
                                            {invoice.invoice_number}
                                        </TableCell>

                                        <TableCell>
                                            {invoice.type === 'sale' ? (
                                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                                    <ArrowUpRight className="mr-1 h-3 w-3" /> Vente
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                                    <ArrowDownLeft className="mr-1 h-3 w-3" /> Achat
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600">
                                            {format(new Date(invoice.date), 'dd/MM/yyyy')}
                                        </TableCell>

                                        <TableCell>
                                            {/* تسييق الـ Session كـ Badge ملون */}
                                            <div className="flex items-center gap-1.5">
                                                {(invoice as any).session ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "flex items-center gap-1 px-2 py-0.5 font-bold border",
                                                            (invoice as any).session.status === 'open'
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" // أخضر يلا كانت محلولة
                                                                : "bg-slate-50 text-slate-600 border-slate-200"      // رمادي يلا كانت مسدودة
                                                        )}
                                                    >
                                                        <Clock className={cn(
                                                            "h-3 w-3",
                                                            (invoice as any).session.status === 'open' ? "text-emerald-500" : "text-slate-400"
                                                        )} />

                                                        <span className="text-[10px] uppercase tracking-wider">
                                                            {format(new Date((invoice as any).session.session_date), 'dd/MM/yy')}
                                                        </span>

                                                        {/* نقطة صغيرة اختيارية لزيادة الوضوح */}
                                                        <span className={cn(
                                                            "size-2 rounded-full ml-0.5",
                                                            (invoice as any).session.status === 'open' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                                        )} />
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="max-w-45 truncate text-sm font-semibold text-slate-700">
                                            <div className="flex flex-col gap-1">
                                                <span>{invoice.billable?.name || '---'}</span>

                                                <div className="flex">
                                                    {invoice.billable_type && (
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                "text-[10px] px-1.5 py-0 font-medium uppercase tracking-wider",
                                                                invoice.billable_type.includes('Customer')
                                                                    ? "bg-blue-50 text-blue-600 hover:bg-blue-50 border-blue-100"
                                                                    : "bg-amber-50 text-amber-600 hover:bg-amber-50 border-amber-100"
                                                            )}
                                                        >
                                                            {invoice.billable_type.split('\\').pop() === 'Customer' ? 'Client' : 'Société'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center font-bold text-slate-700">
                                            {invoice.boxes || 0}
                                        </TableCell>

                                        <TableCell className="bg-slate-50/30 text-right text-base font-black text-slate-900">
                                            {new Intl.NumberFormat('fr-FR', {
                                                minimumFractionDigits: 2,
                                            }).format(Number(invoice.amount))}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Badge
                                                className={cn(
                                                    'rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize shadow-none',
                                                    statusStyles[invoice.status]
                                                )}
                                            >
                                                {invoice.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>

                                        <TableCell
                                            className="text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <InvoiceActions
                                                invoice={invoice}
                                                billables={billables}
                                                sessions={sessions}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="py-24 text-center font-medium text-muted-foreground italic"
                                    >
                                        Aucun bon enregistré pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                            {invoices.total} Bons au total
                        </div>

                        <div className="flex gap-2">
                            {invoices.links.map((link, i) => {
                                const isPrevious = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');


                                if (!link.url && !link.active) {
                                    return null;
                                }

                                return (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className={cn(
                                            'h-9 min-w-9 text-xs font-bold shadow-none transition-all',
                                            !link.url && 'pointer-events-none cursor-not-allowed opacity-40',
                                            link.active && 'scale-105 shadow-md',
                                        )}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <a href={link.url}>
                                                {isPrevious ? <ChevronLeft className="h-4 w-4" /> :
                                                    isNext ? <ChevronRight className="h-4 w-4" /> :
                                                        link.label}
                                            </a>
                                        ) : (
                                            <span>
                                                {isPrevious ? <ChevronLeft className="h-4 w-4" /> :
                                                    isNext ? <ChevronRight className="h-4 w-4" /> :
                                                        link.label}
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