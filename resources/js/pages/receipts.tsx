import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    FileText,
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';

// Types
import type { ReceiptsIndexProps } from '@/types/receipt';

export default function Receipts({ receipts }: ReceiptsIndexProps) {
    const handleRowClick = (receiptId: number) => {
        router.visit(`/receipts/${receiptId}`);
    };

    return (
        <>
            <Head title="Bons de Réception" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="px-2">
                    <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                        Bons de Réception
                    </h1>

                    <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                        Gestion et suivi des bons de réception clients.
                    </p>
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Date
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Client
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Journée
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Zone
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    Total (DH)
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    Caisses
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receipts.data.length > 0 ? (
                                receipts.data.map((receipt) => (
                                    <TableRow
                                        key={receipt.id}
                                        className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        onClick={() =>
                                            handleRowClick(receipt.id)
                                        }
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                            #{receipt.id}
                                        </TableCell>

                                        <TableCell className="font-medium text-slate-900 dark:text-neutral-100">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {formatDateDisplay(
                                                    receipt.date,
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-semibold text-slate-900 capitalize dark:text-neutral-100">
                                            {receipt.customer?.name || '---'}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            {receipt.session_zone?.daily_session
                                                ?.session_date
                                                ? formatDateDisplay(
                                                      receipt.session_zone
                                                          .daily_session
                                                          .session_date,
                                                  )
                                                : '-'}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            {receipt.session_zone?.zone?.name ||
                                                '-'}
                                        </TableCell>

                                        <TableCell className="text-right font-mono text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                            {new Intl.NumberFormat('fr-FR', {
                                                minimumFractionDigits: 2,
                                            }).format(
                                                Number(receipt.total_amount),
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right font-mono text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            {receipt.total_boxes || 0}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucun bon de réception enregistré.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <FileText className="h-4 w-4" />
                            {receipts.meta?.total || receipts.data.length} Bons
                            au total
                        </div>

                        <div className="flex items-center gap-1">
                            {receipts.links?.map((link, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    size="sm"
                                    disabled={!link.url}
                                    asChild={!!link.url}
                                    className={cn(
                                        'h-8 min-w-8 px-2 text-xs font-bold text-neutral-500 shadow-none hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800',
                                        link.active &&
                                            'text-neutral-900 underline underline-offset-4 dark:text-neutral-100',
                                        !link.url && 'opacity-30',
                                    )}
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
