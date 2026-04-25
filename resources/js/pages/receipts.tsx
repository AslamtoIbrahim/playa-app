import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Pencil, Trash2 } from 'lucide-react';

// Components
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
import AddReceiptDialog from '@/components/add-receipt-dialog';
import DeleteReceiptDialog from '@/components/delete-receipt-dialog';
import EditReceiptDialog from '@/components/edit-receipt-dialog';
import type { ReceiptsIndexProps } from '@/types/receipt';

export default function Receipts({ receipts, customers, sessions, boats }: ReceiptsIndexProps) {
    const handleRowClick = (receiptId: number) => {
        // Wayfinder logic or direct Inertia visit
        router.visit(`/receipts/${receiptId}`);
    };

    return (
        <>
            <Head title="Bons de Réception" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                            Bons de Réception
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground">
                            Gestion et suivi des bons de réception clients.
                        </p>
                    </div>

                    <AddReceiptDialog
                        boats={boats}
                        customers={customers}
                        sessions={sessions}
                    />
                </div>

                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent">
                                <TableHead className="w-24 font-bold text-slate-800">ID</TableHead>
                                <TableHead className="font-bold text-slate-800">Date</TableHead>
                                <TableHead className="font-bold text-slate-800">Client</TableHead>
                                <TableHead className="font-bold text-slate-800 text-center">Session</TableHead>
                                <TableHead className="text-right font-bold text-slate-800">Total (DH)</TableHead>
                                <TableHead className="text-center font-bold text-slate-800">Caisses</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {receipts.data.length > 0 ? (
                                receipts.data.map((receipt) => (
                                    <TableRow
                                        key={receipt.id}
                                        onClick={() => handleRowClick(receipt.id)}
                                        className="group cursor-pointer border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700">
                                            #{receipt.id}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600">
                                            {format(new Date(receipt.date), 'dd/MM/yyyy')}
                                        </TableCell>

                                        <TableCell className="max-w-45 truncate text-sm font-semibold text-slate-700">
                                            <div className="flex flex-col gap-1">
                                                <span>{receipt.customer?.name || '---'}</span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {receipt.session ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "flex items-center gap-1 px-2 py-0.5 font-bold border",
                                                            receipt.session.status === 'open'
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : "bg-slate-50 text-slate-600 border-slate-200"
                                                        )}
                                                    >
                                                        <Clock className={cn(
                                                            "h-3 w-3",
                                                            receipt.session.status === 'open' ? "text-emerald-500" : "text-slate-400"
                                                        )} />

                                                        <span className="text-[10px] uppercase tracking-wider">
                                                            {format(new Date(receipt.session.session_date), 'dd/MM/yy')}
                                                        </span>
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </div>
                                        </TableCell>


                                        <TableCell className="bg-slate-50/30 text-right text-base font-black text-slate-900">
                                            {new Intl.NumberFormat('fr-FR', {
                                                minimumFractionDigits: 2,
                                            }).format(Number(receipt.total_amount))}
                                        </TableCell>

                                        <TableCell className="text-center font-bold text-slate-700">
                                            {receipt.total_boxes || 0}
                                        </TableCell>

                                        <TableCell
                                            className="text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <EditReceiptDialog
                                                boats={boats}
                                                receipt={receipt}
                                                customers={customers}
                                                sessions={sessions}
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />

                                            <DeleteReceiptDialog
                                                receiptId={receipt.id}
                                                amount={receipt.total_amount} // تأكد من اسم الـ property (amount أو total_amount)
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="py-24 text-center font-medium text-muted-foreground italic"
                                    >
                                        Aucun bon de réception enregistré.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                            {receipts.meta?.total || receipts.data.length} Bons au total
                        </div>

                        <div className="flex gap-2">
                            {receipts.links?.map((link, i) => {
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

Receipts.layout = (page: any) => ({
    children: page,
    breadcrumbs: [{ title: 'Bons de Réception', href: '/receipts' }],
});