import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import { Customer } from '@/types/customer';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, Ship } from 'lucide-react';

interface Report {
    customer_id: number;
    invoice_date: string;
    boat_id: number;
    total_diff_amount: number;
    items_count: number;
    boat_name?: string;
    customer?: Customer;
}

interface Props {
    reports: Report[];
}

export default function Differences({ reports }: Props) {
    const viewReport = (customerId: number, date: string, boatId: number): void => {
        router.visit(`/differences/report?customer_id=${customerId}&date=${date}&boat_id=${boatId}`);
    };

    return (
        <>
            <Head title="Archives des Écarts" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                {/* Header Section */}
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

                {/* Table Card */}
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
                                <TableHead className="text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Bateau
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    Total Écart
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {reports.length > 0 ? (
                                reports.map((item) => (
                                    <TableRow
                                        key={`${item.customer_id}-${item.invoice_date}-${item.boat_id}`}
                                        className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        onClick={() => viewReport(item.customer_id, item.invoice_date, item.boat_id)}
                                    >
                                        <TableCell className="text-sm font-semibold text-slate-600 dark:text-neutral-300">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {formatDateDisplay(item.invoice_date)}
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-semibold capitalize text-slate-900 dark:text-neutral-100">
                                            {item.customer?.name || '---'}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                    <Ship className="h-3 w-3 text-slate-500 dark:text-neutral-400" />
                                                    {item.boat_name || '---'}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <span
                                                className={`text-base font-black ${
                                                    Number(item.total_diff_amount) >= 0
                                                        ? 'text-slate-900 dark:text-neutral-100'
                                                        : 'text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {Number(item.total_diff_amount) > 0 ? '+' : ''}
                                                {Number(item.total_diff_amount).toLocaleString()} DH
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

                    {/* Footer counter */}
                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
                            {reports.length} Archives au total
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


