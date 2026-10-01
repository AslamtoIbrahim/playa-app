import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ArrowDownLeft,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';

// Components
import SessionZoneBadge from '@/components/receipt-session-zone-badge';
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
import type { Invoice } from '@/types/invoice';

interface Props {
    invoices: {
        data: Invoice[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const statusStyles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
    partially_paid:
        'bg-amber-50 text-amber-700 border-amber-200 shadow-sm dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
    unpaid: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50',
    pending:
        'bg-slate-50 text-slate-600 border-slate-200 border-dashed dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
};

export default function Invoices({ invoices }: Props) {
    const handleRowClick = (invoiceId: number): void => {
        router.visit(show.url(invoiceId));
    };

    return (
        <>
            <Head title="Factures" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                {/* Header Section */}
                <div className="px-2">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-neutral-100">
                        Factures
                    </h1>

                    <p className="text-sm font-medium text-muted-foreground">
                        Gestion et suivi de la facturation (Ventes & Achats).
                    </p>
                </div>

                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-slate-800 dark:text-neutral-200">
                                    N°
                                </TableHead>
                                <TableHead className="font-bold text-slate-800 dark:text-neutral-200">
                                    Type
                                </TableHead>
                                <TableHead className="font-bold text-slate-800 dark:text-neutral-200">
                                    Date
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-neutral-200">
                                    Zone Journée
                                </TableHead>
                                <TableHead className="font-bold text-slate-800 dark:text-neutral-200">
                                    Bénéficiaire
                                </TableHead>
                                <TableHead className="font-bold text-slate-800 dark:text-neutral-200">
                                    Caution
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-neutral-200">
                                    NC
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-800 dark:text-neutral-200">
                                    Total (DH)
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-neutral-200">
                                    Statut
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {invoices.data.length > 0 ? (
                                invoices.data.map((invoice) => (
                                    <TableRow
                                        key={invoice.id}
                                        onClick={() => {
                                            handleRowClick(invoice.id);
                                        }}
                                        className="group cursor-pointer border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800/80 dark:hover:bg-neutral-800/60"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                                            {invoice.invoice_number}
                                        </TableCell>

                                        <TableCell>
                                            {invoice.type === 'sale' ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                >
                                                    <ArrowUpRight className="mr-1 h-3 w-3" />{' '}
                                                    Vente
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400"
                                                >
                                                    <ArrowDownLeft className="mr-1 h-3 w-3" />{' '}
                                                    Achat
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                                            {format(
                                                new Date(invoice.date),
                                                'dd/MM/yyyy',
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {/* {getSessionDisplay(invoice)} */}
                                            <SessionZoneBadge
                                                sessionZone={
                                                    invoice.session_zone
                                                }
                                            />
                                        </TableCell>

                                        {/* Bénéficiaire Column */}
                                        <TableCell className="max-w-50">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-semibold text-slate-700 dark:text-neutral-200">
                                                    {invoice.billable?.name ||
                                                        '---'}
                                                </span>

                                                {invoice.billable_type && (
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            'shrink-0 px-1.5 py-0 text-[9px] font-medium tracking-wider uppercase',
                                                            invoice.billable_type.includes(
                                                                'Customer',
                                                            )
                                                                ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400'
                                                                : 'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400',
                                                        )}
                                                    >
                                                        {invoice.billable_type
                                                            .split('\\')
                                                            .pop() ===
                                                        'Customer'
                                                            ? 'Client'
                                                            : 'Société'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Caution Column */}
                                        <TableCell>
                                            {invoice.caution ? (
                                                <div className="flex w-fit items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                    <ShieldCheck className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />

                                                    <span className="max-w-30 truncate">
                                                        {invoice.caution.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 dark:text-neutral-600">
                                                    Aucune
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center font-bold text-slate-700 dark:text-neutral-300">
                                            {invoice.boxes || 0}
                                        </TableCell>

                                        <TableCell className="bg-slate-50/30 text-right text-base font-black text-slate-900 dark:bg-neutral-800/30 dark:text-neutral-100">
                                            {new Intl.NumberFormat('fr-FR', {
                                                minimumFractionDigits: 2,
                                            }).format(Number(invoice.amount))}
                                        </TableCell>

                                        <TableCell className="text-center">
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
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-neutral-400">
                            {invoices.total} Bons au total
                        </div>

                        <div className="flex gap-2">
                            {invoices.links.map((link, i) => {
                                const isPrevious =
                                    link.label.includes('Previous');
                                const isNext = link.label.includes('Next');

                                if (!link.url && !link.active) {
                                    return null;
                                }

                                return (
                                    <Button
                                        key={i}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        className={cn(
                                            'h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
                                            !link.url &&
                                                'pointer-events-none cursor-not-allowed opacity-40',
                                            link.active &&
                                                'scale-105 shadow-md dark:bg-primary dark:text-primary-foreground',
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

Invoices.layout = (page: ReactNode) => {
    return {
        children: page,
        breadcrumbs: [{ title: 'Factures', href: '/invoices' }],
    };
};
