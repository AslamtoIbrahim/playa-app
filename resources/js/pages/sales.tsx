import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

// Components
import AddSaleDialog from '@/components/add-sale-dialog';
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

// Types
import SaleActions from '@/components/sale-actions';
import { show } from '@/routes/sales';
import type { Customer } from '@/types/customer';
import type { DailySession } from '@/types/daily-session';
import type { Sale } from '@/types/sale';

interface Props {
    sales: {
        data: Sale[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    customers: Customer[];
    sessions: DailySession[];
}

export default function Sales({ sales, customers, sessions }: Props) {
    const handleRowClick = (saleId: number) => {
        router.visit(show(saleId));
    };

    return (
        <>
            <Head title="Ventes" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                            Ventes
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground">
                            Gestion des bons de vente et sorties clients.
                        </p>
                    </div>

                    <AddSaleDialog
                        customers={customers}
                        sessions={sessions}
                    />
                </div>

                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent">
                                <TableHead className="w-16 font-bold text-slate-800">ID</TableHead>
                                <TableHead className="font-bold text-slate-800">Date</TableHead>
                                <TableHead className="font-bold text-slate-800">Client</TableHead>
                                <TableHead className="font-bold text-slate-800 text-center">Journnée</TableHead>
                                <TableHead className="font-bold text-slate-800 text-center">Type</TableHead>
                                <TableHead className="text-center font-bold text-slate-800">Caisses</TableHead>
                                <TableHead className="text-center font-bold text-slate-800">Poids</TableHead>
                                <TableHead className="text-right font-bold text-slate-800">Montant</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sales.data.length > 0 ? (
                                sales.data.map((sale) => (
                                    <TableRow
                                        key={sale.id}
                                        onClick={() => {
                                            handleRowClick(sale.id);
                                        }}
                                        className="group cursor-pointer border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50"
                                    >
                                        <TableCell className="font-mono font-semibold text-slate-900">
                                            #{sale.id}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600">
                                            <div className="flex items-center gap-2">
                                                {format(new Date(sale.date), 'dd/MM/yyyy')}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-700">
                                                    {sale.customer?.name || 'Client Divers'}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {sale.session ? (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "inline-flex items-center gap-1 font-bold border transition-colors",
                                                        // Ila kant open: l'khdar
                                                        sale.session.status === 'open' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                        // Ila kant closed: l'orange (ola amber)
                                                        sale.session.status === 'closed' && "bg-amber-50 text-amber-700 border-amber-200"
                                                    )}
                                                >
                                                    {/* Kandiro dik l'point sghira dyal status */}
                                                    <span className={cn(
                                                        "size-2 rounded-full",
                                                        sale.session.status === 'open' ? "bg-emerald-500" : "bg-amber-500"
                                                    )} />

                                                    <span className="text-[11px] uppercase tracking-wider">
                                                        {format(new Date(sale.session.session_date), 'dd/MM/yy')}
                                                    </span>
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-300">-</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[10px] uppercase font-bold px-2 py-0",
                                                    sale.type === 'usine' ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-blue-50 text-blue-700 border-blue-100"
                                                )}
                                            >
                                                {sale.type}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700">
                                                {sale.boxes || 0}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700">
                                                {sale.weight || 0} <span className="text-[10px] text-muted-foreground">kg</span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="bg-slate-50/30 text-right text-base font-black text-slate-900">
                                            {new Intl.NumberFormat('fr-FR', {
                                                minimumFractionDigits: 2,
                                            }).format(Number(sale.amount))}
                                        </TableCell>

                                        <TableCell
                                            className="text-right"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            <SaleActions
                                                sale={sale}
                                                customers={customers}
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
                                        Aucune vente enregistrée pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                            {sales.total} Ventes au total
                        </div>

                        <div className="flex gap-2">
                            {sales.links.map((link, i) => {
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

Sales.layout = (page: any) => {
    return {
        children: page,
        breadcrumbs: [{ title: 'Ventes', href: '/sales' }],
    };
};