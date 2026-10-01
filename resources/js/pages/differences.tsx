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
import type { Customer } from '@/types/customer';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
} from 'lucide-react';

interface Report {
    customer_id: number;
    invoice_date: string;
    boat_id: number;
    total_diff_amount: number;
    items_count: number;
    boat_name?: string;
    customer?: Customer;
}

interface ReportsPaginator {
    data: Report[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    total?: number;
}

interface Props {
    reports: ReportsPaginator;
}

export default function Differences({ reports }: Props) {
    const viewReport = (
        customerId: number,
        date: string,
        boatId: number,
    ): void => {
        router.visit(
            `/differences/report?customer_id=${customerId}&date=${date}&boat_id=${boatId}`,
        );
    };

    return (
        <>
            <Head title="Archives des Écarts" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Archives des Écarts
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Historique groupé par client et par date.
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Date Facture
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Client
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Bateau
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    Total Écart
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.data.length > 0 ? (
                                reports.data.map((item) => (
                                    <TableRow
                                        key={`${item.customer_id}-${item.invoice_date}-${item.boat_id}`}
                                        className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        onClick={() =>
                                            viewReport(
                                                item.customer_id,
                                                item.invoice_date,
                                                item.boat_id,
                                            )
                                        }
                                    >
                                        <TableCell className="font-medium text-slate-900 dark:text-neutral-100">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {formatDateDisplay(
                                                    item.invoice_date,
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-semibold text-slate-900 capitalize dark:text-neutral-100">
                                            {item.customer?.name || '---'}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            {item.boat_name || '---'}
                                        </TableCell>

                                        <TableCell className="text-right font-mono text-sm font-semibold">
                                            <span
                                                className={cn(
                                                    Number(
                                                        item.total_diff_amount,
                                                    ) >= 0
                                                        ? 'text-slate-900 dark:text-neutral-100'
                                                        : 'text-rose-600 dark:text-rose-400',
                                                )}
                                            >
                                                {Number(
                                                    item.total_diff_amount,
                                                ) > 0
                                                    ? '+'
                                                    : ''}
                                                {Number(
                                                    item.total_diff_amount,
                                                ).toLocaleString('fr-FR')}{' '}
                                                DH
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucun écart enregistré.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <TrendingUp className="h-4 w-4" />
                            {reports.total || reports.data.length} Archives au
                            total
                        </div>

                        <div className="flex items-center gap-1">
                            {reports.links?.map((link, i) => (
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

Differences.layout = {
    breadcrumbs: [
        {
            title: 'Differences',
            href: '/differences',
        },
    ],
};
