import { Head } from '@inertiajs/react';
import {
    ArrowLeft
} from 'lucide-react';

import SessionTotalsCard from '@/components/session-totals-card';
import { SessionHeader } from '@/components/sessison-header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateDisplay } from '@/lib/date';
import type { Attendance } from '@/types/attendance';
import type { DailySession } from '@/types/daily-session';
import type { Invoice } from '@/types/invoice';
import type { Receipt } from '@/types/receipt';
import type { Sale } from '@/types/sale';

interface Props {
    dailySessions: DailySession[];
    zone: { id: number };
    session: DailySession & { zones?: { id: number; name: string }[] };
    purchaseData: {
        invoices: Invoice[];
        differences?: unknown[];
        receipts: Receipt[];
        total: number;
    };
    saleData: {
        sales: Sale[];
        total: number;
    };
    attendances: Attendance[];
    totals: {
        buy: number;
        sell: number;
        margin: number;
    };
}

function SessionShow({
    session,
    purchaseData,
    saleData,
    attendances,
    totals,
}: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD',
        }).format(amount || 0);
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-6 bg-neutral-100 p-4 lg:p-8 dark:bg-neutral-950">
            {/* Top Navigation & Header */}
            <button
                type="button"
                onClick={() => window.history.back()}
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" /> Retour aux journées
            </button>
            
            <SessionHeader session={session} />

            <SessionTotalsCard
                totals={totals}
                status={session.status}
                formatCurrency={formatCurrency}
            />

            <Head
                title={`Session du ${formatDateDisplay(session.session_date)}`}
            />

            {/* Main Tabs: Achats & Ventes */}
            <Tabs defaultValue="achats" className="flex-1 space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-neutral-200/70 p-1 lg:w-96 dark:bg-neutral-800">
                    <TabsTrigger
                        value="achats"
                        className="text-xs font-bold tracking-wider uppercase"
                    >
                        Achats ({formatCurrency(totals.buy)})
                    </TabsTrigger>
                    <TabsTrigger
                        value="ventes"
                        className="text-xs font-bold tracking-wider uppercase"
                    >
                        Ventes ({formatCurrency(totals.sell)})
                    </TabsTrigger>
                </TabsList>

                {/* ================= ACHATS TAB ================= */}
                <TabsContent value="achats" className="space-y-4">
                    <Tabs defaultValue="factures" className="space-y-4">
                        <TabsList className="border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
                            <TabsTrigger
                                value="factures"
                                className="text-xs font-bold"
                            >
                                Factures ({purchaseData.invoices.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="receipts"
                                className="text-xs font-bold"
                            >
                                Receipts ({purchaseData.receipts.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="charges"
                                className="text-xs font-bold"
                            >
                                Charges (0)
                            </TabsTrigger>
                            <TabsTrigger
                                value="ouvries"
                                className="text-xs font-bold"
                            >
                                Ouvries ({attendances.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Achats Sub-tab: Factures */}
                        <TabsContent value="factures">
                            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <Table>
                                    <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                                        <TableRow className="border-b border-neutral-200 text-xs hover:bg-transparent dark:border-neutral-800">
                                            <TableHead className="font-bold">
                                                ID / N°
                                            </TableHead>
                                            <TableHead className="font-bold">
                                                Client / Fournisseur
                                            </TableHead>
                                            <TableHead className="text-right font-bold">
                                                Montant
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseData.invoices.length > 0 ? (
                                            purchaseData.invoices.map((inv) => (
                                                <TableRow
                                                    key={inv.id}
                                                    className="border-b border-neutral-100 dark:border-neutral-800"
                                                >
                                                    <TableCell className="font-medium">
                                                        #{inv.id}
                                                    </TableCell>
                                                    <TableCell>{'-'}</TableCell>
                                                    <TableCell className="text-right font-mono font-bold">
                                                        {formatCurrency(
                                                            inv.amount,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    className="py-12 text-center text-muted-foreground italic"
                                                >
                                                    Aucune facture d'achat
                                                    trouvée pour cette session.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* Achats Sub-tab: Receipts */}
                        <TabsContent value="receipts">
                            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <Table>
                                    <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                                        <TableRow className="border-b border-neutral-200 text-xs hover:bg-transparent dark:border-neutral-800">
                                            <TableHead className="font-bold">
                                                Bon N°
                                            </TableHead>
                                            <TableHead className="font-bold">
                                                Bateau / Fournisseur
                                            </TableHead>
                                            <TableHead className="text-right font-bold">
                                                Montant Total
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseData.receipts.length > 0 ? (
                                            purchaseData.receipts.map((rec) => (
                                                <TableRow
                                                    key={rec.id}
                                                    className="border-b border-neutral-100 dark:border-neutral-800"
                                                >
                                                    <TableCell className="font-medium">
                                                        #{rec.id}
                                                    </TableCell>
                                                    <TableCell>
                                                        {rec.boat?.name ||
                                                            rec.customer
                                                                ?.name ||
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold">
                                                        {formatCurrency(
                                                            rec.total_amount,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    className="py-12 text-center text-muted-foreground italic"
                                                >
                                                    Aucun bon de réception
                                                    d'achat trouvé.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* Achats Sub-tab: Charges */}
                        <TabsContent value="charges">
                            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <p className="text-sm text-muted-foreground italic">
                                    Aucune charge enregistrée pour le moment.
                                </p>
                            </div>
                        </TabsContent>

                        {/* Achats Sub-tab: Ouvries */}
                        <TabsContent value="ouvries">
                            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <Table>
                                    <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                                        <TableRow className="border-b border-neutral-200 text-xs hover:bg-transparent dark:border-neutral-800">
                                            <TableHead className="font-bold">
                                                ID Pointage
                                            </TableHead>
                                            <TableHead className="font-bold">
                                                Zone
                                            </TableHead>
                                            <TableHead className="text-right font-bold">
                                                Total Ouvriers
                                            </TableHead>
                                            <TableHead className="text-right font-bold">
                                                Masse Salariale
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendances.length > 0 ? (
                                            attendances.map((att) => (
                                                <TableRow
                                                    key={att.id}
                                                    className="border-b border-neutral-100 dark:border-neutral-800"
                                                >
                                                    <TableCell className="font-medium">
                                                        #{att.id}
                                                    </TableCell>
                                                    {/* <TableCell>{att.sessionZone?.zone?.name || '-'}</TableCell> */}
                                                    <TableCell className="text-right font-mono">
                                                        {att.items?.length || 0}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-green-600">
                                                        {formatCurrency(
                                                            att.total_wage || 0,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="py-12 text-center text-muted-foreground italic"
                                                >
                                                    Aucun pointage d'ouvriers
                                                    trouvé pour cette session.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* ================= VENTES TAB ================= */}
                <TabsContent value="ventes">
                    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <Table>
                            <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                                <TableRow className="border-b border-neutral-200 text-xs hover:bg-transparent dark:border-neutral-800">
                                    <TableHead className="font-bold">
                                        ID / N°
                                    </TableHead>
                                    <TableHead className="font-bold">
                                        Client
                                    </TableHead>
                                    <TableHead className="text-right font-bold">
                                        Montant
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {saleData.sales.length > 0 ? (
                                    saleData.sales.map((sale) => (
                                        <TableRow
                                            key={sale.id}
                                            className="border-b border-neutral-100 dark:border-neutral-800"
                                        >
                                            <TableCell className="font-medium">
                                                #{sale.id}
                                            </TableCell>
                                            <TableCell>{'-'}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                {formatCurrency(sale.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="py-12 text-center text-muted-foreground italic"
                                        >
                                            Aucune vente trouvée pour cette
                                            session.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default SessionShow;
