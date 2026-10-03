import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Camera, Printer } from 'lucide-react';

import { ExportDropdown } from '@/components/export-dropdown';
import { SaleHeader } from '@/components/sale-header';
import { SalePrintFooter } from '@/components/sale-print-footer';
import { SaleStatsGrid } from '@/components/sale-stats-grid';
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
import { formatDifferenceAmount } from '@/lib/differences';
import { cn } from '@/lib/utils';
import { Sale } from '@/types/sale';
import { SaleItem } from '@/types/sale-item';

interface Props {
    /** Vente et ses distributions, alimentées par les factures d'achat. */
    sale: Sale & { items: SaleItem[] };
}

/**
 * Fiche d'une vente.
 *
 * La vente ne porte plus de lignes saisies à la main : elle est alimentée
 * uniquement depuis les lignes de facture d'achat, via le dialogue de vente.
 * La fiche est donc en lecture seule : article, bateau, facture d'origine,
 * quantité, prix réel et écart réel.
 */
export default function SalesShow({ sale }: Props) {
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
                onClick={() => router.visit('/sales')}
                className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground print:hidden"
            >
                <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            <SaleHeader sale={sale} />
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
                className="relative overflow-hidden rounded-lg border border-slate-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
                <Table>
                    <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <TableRow className="h-11 hover:bg-transparent">
                            <TableHead className="pl-6 text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                Espèces
                            </TableHead>
                            <TableHead className="text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                Bateau
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                Facture
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                Qte / NC
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                Prix Réel
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                P.U Facture
                            </TableHead>
                            <TableHead className="px-4 text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                Diff Total
                            </TableHead>
                            <TableHead className="px-6 text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                Valeur DH
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {items.length > 0 ? (
                            items.map((item) => {
                                {
                                    const invoiceItem = item.invoice_item;

                                    const value =
                                        Number(item.unit_count) *
                                        Number(item.real_price);

                                    const diff = Number(item.total_diff);

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="border-b border-slate-100 hover:bg-slate-50/40 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
                                        >
                                            <TableCell className="pl-6 text-xs font-medium text-slate-900 capitalize dark:text-neutral-100">
                                                {invoiceItem?.item?.name ||
                                                    'Article'}
                                            </TableCell>

                                            <TableCell className="text-xs text-slate-600 dark:text-neutral-300">
                                                {invoiceItem?.boat?.name || '—'}
                                            </TableCell>

                                            <TableCell className="text-center font-mono text-xs text-slate-500 dark:text-neutral-400">
                                                {invoiceItem?.invoice
                                                    ?.invoice_number
                                                    ? `#${invoiceItem.invoice.invoice_number}`
                                                    : '—'}
                                            </TableCell>

                                            <TableCell className="text-center text-xs font-bold text-slate-900 dark:text-neutral-100">
                                                {item.unit_count}{' '}
                                                <span className="text-[10px] font-normal text-slate-500 uppercase dark:text-neutral-400">
                                                    {invoiceItem?.unit}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-right text-xs font-medium text-slate-700 dark:text-neutral-200">
                                                {Number(
                                                    item.real_price,
                                                ).toLocaleString('fr-FR', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>

                                            <TableCell className="text-right text-xs text-slate-400 dark:text-neutral-500">
                                                {invoiceItem
                                                    ? Number(
                                                          invoiceItem.unit_price,
                                                      ).toLocaleString(
                                                          'fr-FR',
                                                          {
                                                              minimumFractionDigits: 2,
                                                          },
                                                      )
                                                    : '—'}
                                            </TableCell>

                                            <TableCell
                                                className={cn(
                                                    'px-4 text-right text-xs font-bold',
                                                    diff < 0
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : diff > 0
                                                          ? 'text-green-600 dark:text-green-400'
                                                          : 'text-slate-600 dark:text-neutral-300',
                                                )}
                                            >
                                                {(diff > 0 ? '+' : '') +
                                                    formatDifferenceAmount(diff)}
                                            </TableCell>

                                            <TableCell className="px-6 text-right text-xs font-bold text-slate-900 dark:text-neutral-100">
                                                {value.toLocaleString('fr-FR', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
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