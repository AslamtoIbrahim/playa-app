import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Camera, Printer } from 'lucide-react';
import { useState } from 'react';

import { ExportDropdown } from '@/components/export-dropdown';
import { SaleHeader } from '@/components/sale-header';
import {
    SaleColumnFilter,
    SaleColumnTotals,
    SaleGlobalSearch,
} from '@/components/sale-item-filters';
import { SalePrintFooter } from '@/components/sale-print-footer';
import { SaleReceiptChargesTable } from '@/components/sale-receipt-charges-table';
import SaleShowItemRow from '@/components/sale-show-item-row';
import { SaleStatsGrid } from '@/components/sale-stats-grid';
import { SaleWorkersTable } from '@/components/sale-workers-table';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSaleCalculations } from '@/hooks/use-sale-calculations';
import { useSaleExport } from '@/hooks/use-sale-export';
import { useSaleItemFilters } from '@/hooks/use-sale-item-filters';
import { useScreenshot } from '@/hooks/use-screenshot';
import AppLayout from '@/layouts/app-layout';
import type { Sale } from '@/types/sale';
import type { SaleCharge } from '@/types/sale-charge';
import type { SaleItem } from '@/types/sale-item';
import type { SaleWorker } from '@/types/sale-worker';
import type { SessionZone } from '@/types/session-zone';
import type { Boat } from '@/types/boat';
import type { Item } from '@/types/item';

interface Props {
    /** Sale with its manually managed line items. */
    sale: Sale & {
        items: SaleItem[];
        charges?: SaleCharge[];
        workers?: SaleWorker[];
    };
    /**
     * Session zones inferred from invoice-backed lines; manual lines have no
     * invoice zone. A sale belongs to a daily session rather than one zone.
     */
    sessionZones: SessionZone[];
    /** URL de retour explicite fournie par le backend (journée liée ou liste). */
    backUrl: string;
    /** Ventes de la journée. */
    sales?: Sale[];
    catalogItems: Item[];
    boats: Boat[];
}

/**
 * Sale details and its saved item lines.
 */
export default function SalesShow({ sale, sessionZones, backUrl }: Props) {
    const items = sale.items || [];

    const calculatedStats = useSaleCalculations(sale);
    const stats = {
        ...calculatedStats,
        totalBoxes: Math.abs(calculatedStats.totalBoxes),
        totalValeur: Math.abs(calculatedStats.totalValeur),
        netToPay: Math.abs(calculatedStats.netToPay),
        formattedTotalValeur: Math.abs(
            calculatedStats.totalValeur,
        ).toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
        formattedNetToPay: Math.abs(calculatedStats.netToPay).toLocaleString(
            'fr-FR',
            { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        ),
    };

    const { copyToClipboard } = useScreenshot();

    const { exportToExcel, exportToCSV, exportToPDF } = useSaleExport();

    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const {
        filters,
        setFilters,
        filteredItems,
        activeFilterCount,
        clearColumnFilters,
    } = useSaleItemFilters(items);

    const toggleColumnFilters = () => {
        if (showColumnFilters) {
            clearColumnFilters();
            setShowColumnFilters(false);

            return;
        }

        setShowColumnFilters(true);
    };

    const boatOptions = [
        ...new Set(
            items.map(
                (item) =>
                    item.boat?.name ?? item.invoice_item?.boat?.name ?? '—',
            ),
        ),
    ].sort();
    const itemOptions = [
        ...new Set(
            items
                .map(
                    (item) =>
                        item.item?.name ?? item.invoice_item?.category?.name,
                )
                .filter((name): name is string => Boolean(name)),
        ),
    ].sort();

    const handlePrint = () => {
        window.print();
    };

    const handleScreenshot = () => {
        copyToClipboard('sale-content');
    };

    const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
        if (type === 'excel') {
            {
                exportToExcel(sale, items);
            }
        }

        if (type === 'pdf') {
            {
                exportToPDF(sale, items, stats);
            }
        }

        if (type === 'csv') {
            {
                exportToCSV(sale, items);
            }
        }
    };

    return (
        <div className="min-h-screen w-full min-w-0 space-y-6 bg-white p-6 font-sans text-slate-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Head title={`Vente #${sale.id}`} />

            <button
                type="button"
                onClick={() => router.get(backUrl, {}, { fresh: true })}
                className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground print:hidden"
            >
                <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            <SaleHeader sale={sale} sessionZones={sessionZones} />
            <SaleStatsGrid stats={stats} />

            <div className="flex justify-end gap-4 print:hidden">
                <Button
                    onClick={handleScreenshot}
                    variant="outline"
                    size="sm"
                    title="Copy for WhatsApp"
                    className="h-9 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                    <Camera className="h-4 w-4" />
                </Button>

                <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                    <Printer className="h-3 w-3" />
                </Button>

                <ExportDropdown onExport={handleExport} />
            </div>

            <div
                id="sale-content"
                className="relative overflow-hidden rounded-lg rounded-b-none border border-slate-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
                <div className="flex h-14 items-center justify-between border-b border-orange-200/60 bg-orange-50/70 px-3 py-2 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80 print:hidden">
                    <SaleGlobalSearch
                        value={filters.search}
                        onChange={(search) =>
                            setFilters((current) => ({ ...current, search }))
                        }
                        showColumnFilters={showColumnFilters}
                        activeFilterCount={activeFilterCount}
                        onToggleColumnFilters={toggleColumnFilters}
                    />
                    <span className="mr-2 text-xs text-muted-foreground">
                        {filteredItems.length} / {items.length} lignes
                    </span>
                </div>
                <Table>
                    <TableHeader
                        className={`border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                    >
                        <SaleColumnTotals
                            items={filteredItems}
                            visible={
                                showColumnFilters ||
                                filters.search.trim().length > 0
                            }
                        />
                        <TableRow className="h-11 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                                <span className="inline-flex items-center">
                                    Bateau
                                    <SaleColumnFilter
                                        column="boat"
                                        title="Bateau"
                                        options={boatOptions}
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                                <span className="inline-flex items-center">
                                    Article
                                    <SaleColumnFilter
                                        column="item"
                                        title="Article"
                                        options={itemOptions}
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                                <span className="inline-flex items-center">
                                    Quantité
                                    <SaleColumnFilter
                                        column="quantity"
                                        title="Quantité"
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                                <span className="inline-flex items-center">
                                    Prix vente
                                    <SaleColumnFilter
                                        column="sale_price"
                                        title="Prix vente"
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                                <span className="inline-flex items-center">
                                    Prix réel
                                    <SaleColumnFilter
                                        column="real_price"
                                        title="Prix réel"
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                                <span className="inline-flex items-center">
                                    Montant
                                    <SaleColumnFilter
                                        column="amount"
                                        title="Montant"
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                                <span className="inline-flex items-center">
                                    Taxe 3%
                                    <SaleColumnFilter
                                        column="tax"
                                        title="Taxe 3%"
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </span>
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black tracking-tight text-orange-800 uppercase dark:text-orange-300">
                                <span className="inline-flex items-center">
                                    Total diff
                                    <SaleColumnFilter
                                        column="total_diff"
                                        title="Total diff"
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <SaleShowItemRow key={item.id} item={item} />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="py-24 text-center font-medium text-muted-foreground italic"
                                >
                                    {items.length > 0
                                        ? 'Aucune ligne ne correspond aux filtres actifs.'
                                        : 'Aucune ligne de vente enregistrée pour le moment.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Bons imputés (SaleCharges) + parts ouvrières (SaleWorkers) :
                même source de vérité que les statistiques ci-dessus. */}
            <div
                className={
                    (sale.charges?.length ?? 0) > 0 ||
                    (sale.workers?.length ?? 0) > 0
                        ? 'grid grid-cols-1 gap-4 lg:grid-cols-2'
                        : ''
                }
            >
                {(sale.charges?.length ?? 0) > 0 ? (
                    <SaleReceiptChargesTable charges={sale.charges ?? []} />
                ) : null}

                {(sale.workers?.length ?? 0) > 0 ? (
                    <SaleWorkersTable workers={sale.workers ?? []} />
                ) : null}
            </div>

            <SalePrintFooter stats={stats} />
        </div>
    );
}

SalesShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Ventes', href: '/sales' },
            { title: 'Détails de la Vente', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
