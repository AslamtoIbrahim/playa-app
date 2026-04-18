import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { show } from '@/routes/invoices'; // تأكد من استيراد المسار

// Types
import type { Customer } from '@/types/customers';
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
    customers: Customer[];
    officeRooms: OfficeRoom[];
}

const statusStyles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
    unpaid: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm',
    pending: 'bg-slate-50 text-slate-600 border-slate-200 border-dashed',
};

export default function Invoices({ invoices, customers, officeRooms }: Props) {
    // Function handle row click
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
                            Gestion et suivi de la facturation client.
                        </p>
                    </div>
                    <AddInvoiceDialog
                        customers={customers}
                        officeRooms={officeRooms}
                    />
                </div>

                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent">
                                <TableHead className="w-25 font-bold text-slate-800">
                                    N°
                                </TableHead>
                                <TableHead className="font-bold text-slate-800">
                                    Date
                                </TableHead>
                                <TableHead className="font-bold text-slate-800">
                                    Ville
                                </TableHead>
                                <TableHead className="font-bold text-slate-800">
                                    Compte
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800">
                                    NC
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800">
                                    Poids (KG)
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-800">
                                    Net à Payer
                                </TableHead>
                                <TableHead className="font-bold text-slate-800">
                                    Statut
                                </TableHead>
                                <TableHead className="pt-4 text-right text-[10px] leading-none font-bold tracking-wider text-emerald-700 uppercase">
                                    Payé (DH)
                                </TableHead>
                                <TableHead className="w-12.5"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.data.length > 0 ? (
                                invoices.data.map((invoice) => (
                                    <TableRow
                                        key={invoice.id}
                                        // الكليك على السطر كامل
                                        onClick={() =>
                                            handleRowClick(invoice.id)
                                        }
                                        className="group cursor-pointer border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-blue-700">
                                            {invoice.invoice_number}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600">
                                            {format(
                                                new Date(invoice.date),
                                                'dd/MM/yyyy',
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className="rounded-md bg-slate-100 text-[10px] font-bold text-slate-700 uppercase"
                                            >
                                                {(invoice as any).office_room
                                                    ?.city || '-'}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="max-w-45 truncate text-sm font-semibold text-slate-700">
                                            {invoice.customer?.name || '---'}
                                        </TableCell>

                                        <TableCell className="text-center font-bold text-slate-700">
                                            {invoice.boxes || 0}
                                        </TableCell>

                                        <TableCell className="text-center text-sm font-medium text-slate-500">
                                            {invoice.weight &&
                                            invoice.weight > 0
                                                ? invoice.weight
                                                : '-'}
                                        </TableCell>

                                        <TableCell className="bg-slate-50/30 text-right text-base font-black text-slate-900">
                                            {new Intl.NumberFormat('fr-FR', {
                                                minimumFractionDigits: 2,
                                            }).format(invoice.amount)}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    'rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize shadow-none',
                                                    statusStyles[
                                                        invoice.status
                                                    ],
                                                )}
                                            >
                                                {invoice.status.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right text-sm font-bold text-emerald-600">
                                            {new Intl.NumberFormat(
                                                'fr-FR',
                                            ).format(
                                                invoice.total_paid ||
                                                    (invoice as any)
                                                        .payments_sum_amount ||
                                                    0,
                                            )}
                                        </TableCell>

                                        <TableCell
                                            className="text-right"
                                            // هنا كنمنعو الكليك فـ الأكشنز باش مايدخلش للتفاصيل بالخطأ
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <InvoiceActions
                                                invoice={invoice}
                                                customers={customers}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={10}
                                        className="py-24 text-center font-medium text-muted-foreground italic"
                                    >
                                        Aucune facture enregistrée pour le
                                        moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                            {invoices.total} Factures au total
                        </div>
                        <div className="flex gap-2">
                            {invoices.links.map((link, i) => {
                                const isPrevious =
                                    link.label.includes('Previous');
                                const isNext = link.label.includes('Next');

                                return (
                                    <Button
                                        key={i}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        className={cn(
                                            'h-9 min-w-9 text-xs font-bold shadow-none transition-all',
                                            !link.url &&
                                                'pointer-events-none cursor-not-allowed opacity-40',
                                            link.active &&
                                                'scale-105 shadow-md',
                                        )}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <a href={link.url}>
                                                {isPrevious ? (
                                                    <ChevronLeft className="h-4 w-4" />
                                                ) : isNext ? (
                                                    <ChevronRight className="h-4 w-4" />
                                                ) : (
                                                    link.label
                                                )}
                                            </a>
                                        ) : (
                                            <span>
                                                {isPrevious ? (
                                                    <ChevronLeft className="h-4 w-4" />
                                                ) : isNext ? (
                                                    <ChevronRight className="h-4 w-4" />
                                                ) : (
                                                    link.label
                                                )}
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
