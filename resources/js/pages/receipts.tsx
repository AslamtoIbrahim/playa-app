import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    FileText,
} from 'lucide-react';
import { useState } from 'react';

// Components
import {
    ReceiptColumnFilter,
    ReceiptFilterSummary,
    ReceiptSearch,
} from '@/components/receipt-filters';
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
import { useReceiptFilters } from '@/hooks/use-receipt-filters';

// Types
import type { ReceiptsIndexProps } from '@/types/receipt';

export default function Receipts({ receipts }: ReceiptsIndexProps) {
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const { filters, setFilters, filteredReceipts, activeFilterCount } =
        useReceiptFilters(receipts.data);

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
                    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <ReceiptSearch
                            value={filters.search}
                            onChange={(search) =>
                                setFilters((current) => ({
                                    ...current,
                                    search,
                                }))
                            }
                            showColumnFilters={showColumnFilters}
                            activeFilterCount={activeFilterCount}
                            onToggleColumnFilters={() =>
                                setShowColumnFilters((current) => !current)
                            }
                            onClearFilters={() =>
                                setFilters({ search: '', columns: {} })
                            }
                        />
                    </div>
                    <Table>
                        <TableHeader
                            className={`bg-neutral-50/50 dark:bg-neutral-800/50 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                        >
                            <ReceiptFilterSummary
                                receipts={filteredReceipts}
                                totalReceipts={receipts.data.length}
                            />
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        ID
                                        <ReceiptColumnFilter
                                            column="id"
                                            title="ID"
                                            kind="number"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Date
                                        <ReceiptColumnFilter
                                            column="date"
                                            title="Date"
                                            kind="date"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Client
                                        <ReceiptColumnFilter
                                            column="customer"
                                            title="Client"
                                            kind="text"
                                            options={[
                                                ...new Set(
                                                    receipts.data.map(
                                                        (receipt) =>
                                                            receipt.customer
                                                                ?.name || '---',
                                                    ),
                                                ),
                                            ].sort((a, b) =>
                                                a.localeCompare(b, 'fr'),
                                            )}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Journée
                                        <ReceiptColumnFilter
                                            column="session_date"
                                            title="Journée"
                                            kind="date"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Zone
                                        <ReceiptColumnFilter
                                            column="zone"
                                            title="Zone"
                                            kind="text"
                                            options={[
                                                ...new Set(
                                                    receipts.data.map(
                                                        (receipt) =>
                                                            receipt.session_zone
                                                                ?.zone?.name ||
                                                            '-',
                                                    ),
                                                ),
                                            ].sort((a, b) =>
                                                a.localeCompare(b, 'fr'),
                                            )}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Total (DH)
                                        <ReceiptColumnFilter
                                            column="total_amount"
                                            title="Total (DH)"
                                            kind="number"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Caisses
                                        <ReceiptColumnFilter
                                            column="total_boxes"
                                            title="Caisses"
                                            kind="number"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReceipts.length > 0 ? (
                                filteredReceipts.map((receipt) => (
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

                        <div className="flex gap-2">
                            {receipts.links?.map((link, i) => {
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

Receipts.layout = {
    breadcrumbs: [
        {
            title: 'Bons de Réception',
            href: '/receipts',
        },
    ],
};
