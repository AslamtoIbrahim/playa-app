import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Camera, Printer, ShoppingCart } from 'lucide-react';

import { ExportDropdown } from '@/components/export-dropdown';
import { SaleHeader } from '@/components/sale-header';
import { GlobalSaleDialog } from '@/components/global-sale-dialog';
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
import { useScreenshot } from '@/hooks/use-screenshot';
import AppLayout from '@/layouts/app-layout';
import { Sale } from '@/types/sale';
import { SaleCharge } from '@/types/sale-charge';
import { SaleItem } from '@/types/sale-item';
import { SaleWorker } from '@/types/sale-worker';
import { SessionZone } from '@/types/session-zone';
import { Boat } from '@/types/boat';
import { Item } from '@/types/item';
import { useState } from 'react';

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
export default function SalesShow({
    sale,
    sessionZones,
    backUrl,
    catalogItems,
    boats,
}: Props) {
    const [saleDialogOpen, setSaleDialogOpen] = useState(false);
    const items = sale.items || [];

    const stats = useSaleCalculations(sale);

    const { copyToClipboard } = useScreenshot();

    const { exportToExcel, exportToCSV, exportToPDF } = useSaleExport();

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
        <div className="mx-auto min-h-screen max-w-7xl space-y-6 bg-white p-6 font-sans text-slate-900 dark:bg-neutral-950 dark:text-neutral-100">
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
                    onClick={() => setSaleDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    title="Ajouter un article à la vente"
                    aria-label="Ajouter un article à la vente"
                    className="h-9 border-amber-200 text-amber-700 shadow-sm hover:bg-amber-50 dark:border-amber-900 dark:bg-neutral-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
                >
                    <ShoppingCart className="h-4 w-4" />
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
                <Table>
                    <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <TableRow className="h-11 hover:bg-transparent">
                            <TableHead>Bateau</TableHead>
                            <TableHead>Article</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Prix vente</TableHead>
                            <TableHead>Prix réel</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Taxe 3%</TableHead>
                            <TableHead>Avec taxe</TableHead>
                            <TableHead>Total diff</TableHead>
                            <TableHead aria-label="Actions" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {items.length > 0 ? (
                            items.map((item) => (
                                <SaleShowItemRow key={item.id} item={item} />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={10}
                                    className="py-24 text-center font-medium text-muted-foreground italic"
                                >
                                    Aucune ligne de vente enregistrée pour le
                                    moment.
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

            <GlobalSaleDialog
                open={saleDialogOpen}
                onOpenChange={setSaleDialogOpen}
                sale={sale}
                items={catalogItems}
                boats={boats}
            />
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
