import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {  ChevronLeft, ChevronRight, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';

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

export default function Receipts({
    receipts,
    customers,
    sessionZones,
    boats,
}: ReceiptsIndexProps) {
    const handleRowClick = (receiptId: number) => {
        router.visit(`/receipts/${receiptId}`);
    };

    return (
        <>
            <Head title="Bons de Réception" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Bons de Réception
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion et suivi des bons de réception clients.
                        </p>
                    </div>

                    <AddReceiptDialog
                        boats={boats}
                        customers={customers}
                        sessionZones={sessionZones}
                    />
                </div>


                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-neutral-900/50">
                            <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-slate-800 dark:text-slate-200">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                    Date
                                </TableHead>
                                <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                    Client
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">
                                    Journée
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">
                                    Zone
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-800 dark:text-slate-200">
                                    Total (DH)
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">
                                    Caisses
                                </TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {receipts.data.length > 0 ? (
                                receipts.data.map((receipt) => (
                                    <TableRow
                                        key={receipt.id}
                                        onClick={() =>
                                            handleRowClick(receipt.id)
                                        }
                                        className="group cursor-pointer border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-800/70"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                                            #{receipt.id}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {format(
                                                new Date(receipt.date),
                                                'dd/MM/yyyy',
                                            )}
                                        </TableCell>

                                        <TableCell className="max-w-45 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            <div className="flex flex-col gap-1">
                                                <span>
                                                    {receipt.customer?.name ||
                                                        '---'}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {receipt.session_zone ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'flex items-center gap-1 border px-2 py-0.5 font-bold',
                                                            receipt.session_zone.daily_session
                                                                ?.status ===
                                                                'open'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-300',
                                                        )}
                                                    >
                                                        <Clock
                                                            className={cn(
                                                                'h-3 w-3',
                                                                receipt
                                                                    .session_zone
                                                                    .daily_session
                                                                    ?.status ===
                                                                    'open'
                                                                    ? 'text-emerald-500 dark:text-emerald-400'
                                                                    : 'text-slate-400 dark:text-slate-500',
                                                            )}
                                                        />

                                                        <span className="text-[10px] tracking-wider uppercase">
                                                            {receipt.session_zone?.daily_session?.session_date
                                                                ? format(new Date(receipt.session_zone.daily_session.session_date), 'dd/MM/yy')
                                                                : ''
                                                            }
                                                        </span>
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-neutral-600">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {receipt.session_zone ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn('flex items-center gap-1 border-slate-200 bg-slate-50 px-2 py-0.5 font-bold text-slate-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-300')}
                                                    >
                                                        <MapPin className="h-3 w-3 text-slate-500 dark:text-slate-400" />

                                                        <span className="text-[10px] tracking-wider uppercase">
                                                            {
                                                            receipt.session_zone?.zone?.name
                                                            }
                                                        </span>
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-neutral-600">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="bg-slate-50/30 text-right text-base font-black text-slate-900 dark:bg-neutral-800/20 dark:text-slate-100">
                                            {new Intl.NumberFormat('fr-FR', {
                                                minimumFractionDigits: 2,
                                            }).format(
                                                Number(receipt.total_amount),
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center font-bold text-slate-700 dark:text-slate-300">
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
                                                sessionZones={sessionZones}
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />

                                            <DeleteReceiptDialog
                                                receiptId={receipt.id}
                                                amount={receipt.total_amount}
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
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
                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
                            {receipts.meta?.total || receipts.data.length}{' '}
                            Bons au total
                        </div>

                        <div className="flex gap-1">
                            {receipts.links?.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    disabled={!link.url}
                                    className={cn(
                                        'h-8 min-w-8 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800',
                                        link.active &&
                                        'scale-105 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
                                        !link.url && 'opacity-30',
                                    )}
                                    asChild={!!link.url}
                                >
                                    {link.url ? (
                                        <a href={link.url}>
                                            {link.label.includes('Previous') ? (
                                                <ChevronLeft className="h-4 w-4" />
                                            ) : link.label.includes('Next') ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                link.label
                                            )}
                                        </a>
                                    ) : (
                                        <span>
                                            {link.label.includes('Previous') ? (
                                                <ChevronLeft className="h-4 w-4" />
                                            ) : link.label.includes('Next') ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                link.label
                                            )}
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Receipts.layout = {
    breadcrumbs: [
        {
            title: 'Bons de Réception',
            href: '/receipts',
        },
    ],
};

