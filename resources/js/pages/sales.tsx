import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

// Components
import {
    SalesColumnFilter,
    SalesFilterSummary,
    SalesSearch,
} from '@/components/sales-filters';
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
import { useSaleFilters } from '@/hooks/use-sale-filters';

// Types
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

export default function Sales({ sales }: Props) {
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const {
        filters,
        setFilters,
        filteredSales,
        activeFilterCount,
        clearColumnFilters,
    } = useSaleFilters(sales.data);
    const filterOptions = useMemo(() => {
        return {
            customer: Array.from(
                new Set([
                    ...sales.data.map(
                        (sale) => sale.owner?.name ?? 'Client Divers',
                    ),
                    'Client Divers',
                ]),
            ).map((value) => ({ value, label: value })),
            type: [
                { value: 'normal', label: 'Normal' },
                { value: 'usine', label: 'Usine' },
            ],
        };
    }, [sales.data]);

    const toggleColumnFilters = () => {
        if (showColumnFilters) {
            clearColumnFilters();
            setShowColumnFilters(false);

            return;
        }

        setShowColumnFilters(true);
    };

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
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-slate-100">
                            Ventes
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                            Gestion des bons de vente et sorties clients.
                        </p>
                    </div>
                </div>

                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <SalesSearch
                            value={filters.search}
                            onChange={(search) =>
                                setFilters((current) => ({
                                    ...current,
                                    search,
                                }))
                            }
                            showColumnFilters={showColumnFilters}
                            activeFilterCount={activeFilterCount}
                            onToggleColumnFilters={toggleColumnFilters}
                        />
                    </div>
                    <Table>
                        <TableHeader
                            className={`bg-slate-50/50 dark:bg-neutral-800/50 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                        >
                            <SalesFilterSummary
                                sales={filteredSales}
                                totalSales={sales.data.length}
                            />
                            <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent dark:border-neutral-700">
                                <TableHead className="w-16 font-bold text-slate-800 dark:text-slate-200">
                                    <span className="inline-flex items-center">
                                        ID
                                        <SalesColumnFilter
                                            column="id"
                                            title="ID"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                    <span className="inline-flex items-center">
                                        Date
                                        <SalesColumnFilter
                                            column="date"
                                            title="Date"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                    <span className="inline-flex items-center">
                                        Client / Usine
                                        <SalesColumnFilter
                                            column="customer"
                                            title="Client / Usine"
                                            options={filterOptions.customer}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">
                                    <span className="inline-flex items-center">
                                        Journée
                                        <SalesColumnFilter
                                            column="session"
                                            title="Journée"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">
                                    <span className="inline-flex items-center">
                                        Type
                                        <SalesColumnFilter
                                            column="type"
                                            title="Type"
                                            options={filterOptions.type}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">
                                    <span className="inline-flex items-center">
                                        Caisses
                                        <SalesColumnFilter
                                            column="boxes"
                                            title="Caisses"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">
                                    <span className="inline-flex items-center">
                                        Poids
                                        <SalesColumnFilter
                                            column="weight"
                                            title="Poids"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-800 dark:text-slate-200">
                                    <span className="inline-flex items-center">
                                        Montant
                                        <SalesColumnFilter
                                            column="amount"
                                            title="Montant"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredSales.length > 0 ? (
                                filteredSales.map((sale) => (
                                    <TableRow
                                        key={sale.id}
                                        onClick={() => {
                                            handleRowClick(sale.id);
                                        }}
                                        className="group cursor-pointer border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                                    >
                                        <TableCell className="font-mono font-semibold text-slate-900">
                                            #{sale.id}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600">
                                            <div className="flex items-center gap-2">
                                                {format(
                                                    new Date(sale.date),
                                                    'dd/MM/yyyy',
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-700">
                                                    {sale.owner?.name ||
                                                        'Client Divers'}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {sale.session ? (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'inline-flex items-center gap-1 border font-bold transition-colors',
                                                        sale.session.status ===
                                                            'open' &&
                                                            'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                                                        sale.session.status ===
                                                            'closed' &&
                                                            'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'size-2 rounded-full',
                                                            sale.session
                                                                .status ===
                                                                'open'
                                                                ? 'bg-emerald-500 dark:bg-emerald-400'
                                                                : 'bg-amber-500 dark:bg-amber-400',
                                                        )}
                                                    />

                                                    <span className="text-[11px] tracking-wider uppercase">
                                                        {format(
                                                            new Date(
                                                                sale.session
                                                                    .session_date,
                                                            ),
                                                            'dd/MM/yy',
                                                        )}
                                                    </span>
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-300 dark:text-neutral-600">
                                                    -
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    'px-2 py-0 text-[10px] font-bold uppercase',
                                                    sale.type === 'usine'
                                                        ? 'border border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                                                        : 'border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300',
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
                                                {sale.weight || 0}{' '}
                                                <span className="text-[10px] text-muted-foreground">
                                                    kg
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="bg-slate-50/30 text-right text-base font-black text-slate-900 dark:bg-slate-900/30 dark:text-slate-100">
                                            {new Intl.NumberFormat('fr-FR', {
                                                minimumFractionDigits: 2,
                                            }).format(Number(sale.amount))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="py-24 text-center font-medium text-muted-foreground italic"
                                    >
                                        Aucune vente trouvée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                            {sales.total} Ventes au total
                        </div>

                        <div className="flex gap-2">
                            {sales.links.map((link, i) => {
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
                                            'h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-700 dark:hover:text-slate-100',
                                            !link.url &&
                                                'pointer-events-none cursor-not-allowed opacity-40',
                                            link.active &&
                                                'scale-105 shadow-md dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90',
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

Sales.layout = (page: any) => {
    return {
        children: page,
        breadcrumbs: [{ title: 'Ventes', href: '/sales' }],
    };
};
