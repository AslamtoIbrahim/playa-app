import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SessionPurchaseTab } from '../hooks/use-session-tabs';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, FileText, PackageCheck, Users } from 'lucide-react';
import { groupSessionDifferencesByReport } from '@/lib/differences';
import type { Attendance } from '@/types/attendance';
import type { SessionGroupData } from '@/types/daily-session';

import { SessionAttendancesTable } from './session-attendances-table';
import type { SessionAttendanceAddContextInput } from './session-attendances-table';
import type { DailySession } from '@/types/daily-session';
import type { Sale } from '@/types/sale';

import { SessionInvoicesTable } from './session-invoices-table';
import type { SessionInvoiceAddContextInput } from './session-invoices-table';
import { SessionReceiptsTable } from './session-receipts-table';
import type { SessionReceiptAddContextInput } from './session-receipts-table';
import { SessionDifferencesTable } from './session-differences-table';
import { SessionTabTotalHint } from './session-tab-total-hint';

export interface SessionPurchasesTabProps {
    activeTab: SessionPurchaseTab;
    onTabChange: (value: string) => void;
    purchaseData: SessionGroupData;
    attendances: Attendance[];
    formatCurrency: (amount: number) => string;
    /** Contexte de la journée : création + actions de ligne sur les factures. */
    invoiceContext?: SessionInvoiceAddContextInput | null;
    /** Contexte de la journée : création + actions de ligne sur les bons de réception. */
    receiptContext?: SessionReceiptAddContextInput | null;
    /** Contexte de la journée : création d'une feuille de pointage pour les zones de la journée. */
    attendanceContext?: SessionAttendanceAddContextInput | null;
    /** Ventes de la journée : cibles pour vendre un bon. */
    sales?: Sale[];
    /** Session courante pour créer la vente manquante. */
    session?: DailySession | null;
    sessionId: number;
}

export function SessionPurchasesTab({
    activeTab,
    onTabChange,
    purchaseData,
    attendances,
    formatCurrency,
    invoiceContext = null,
    receiptContext = null,
    attendanceContext = null,
    sales = [],
    session = null,
    sessionId,
}: SessionPurchasesTabProps) {
    const invoicesTotal = purchaseData.invoices.reduce(
        (sum, invoice) => sum + Number(invoice.amount ?? 0),
        0,
    );
    const receiptsTotal = purchaseData.receipts.reduce(
        (sum, receipt) => sum + Number(receipt.total_amount ?? 0),
        0,
    );
    const differencesTotal = groupSessionDifferencesByReport(
        purchaseData.differences,
        purchaseData.receipts,
    ).reduce((sum, report) => sum + report.totalDiff, 0);
    const attendancesTotal = attendances.reduce(
        (sum, attendance) => sum + Number(attendance.total_wage ?? 0),
        0,
    );

    const purchaseSubTabClass = cn(
        'h-auto min-h-11 cursor-pointer justify-start gap-2 rounded-xl border border-transparent px-3 py-2 text-xs font-semibold',
        'bg-transparent text-slate-600 shadow-none transition-all hover:bg-white hover:text-blue-700 hover:shadow-sm',
        'aria-selected:border-blue-200 aria-selected:bg-white aria-selected:text-blue-700 aria-selected:shadow-sm',
        'dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-blue-300',
        'dark:aria-selected:border-blue-500/30 dark:aria-selected:bg-neutral-900 dark:aria-selected:text-blue-300',
        'sm:text-sm',
    );

    return (
        <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="flex w-full flex-col gap-6"
        >
            {/* Achats sub-tabs */}
            <div className="mb-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2 dark:border-neutral-800 dark:bg-neutral-950/60">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 bg-transparent p-0 sm:grid-cols-4">
                    <SessionTabTotalHint
                        total={invoicesTotal}
                        formatCurrency={formatCurrency}
                        tone="blue"
                    >
                        <TabsTrigger
                            value="factures"
                            className={purchaseSubTabClass}
                        >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 text-left">
                                Factures
                            </span>
                            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-600 tabular-nums dark:bg-neutral-800 dark:text-neutral-300">
                                {purchaseData.invoices.length}
                            </span>
                        </TabsTrigger>
                    </SessionTabTotalHint>

                    <SessionTabTotalHint
                        total={receiptsTotal}
                        formatCurrency={formatCurrency}
                        tone="blue"
                    >
                        <TabsTrigger
                            value="receipts"
                            className={purchaseSubTabClass}
                        >
                            <PackageCheck className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 text-left">
                                Réceptions
                            </span>
                            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-600 tabular-nums dark:bg-neutral-800 dark:text-neutral-300">
                                {purchaseData.receipts.length}
                            </span>
                        </TabsTrigger>
                    </SessionTabTotalHint>

                    <SessionTabTotalHint
                        total={differencesTotal}
                        formatCurrency={formatCurrency}
                        tone="blue"
                    >
                        <TabsTrigger
                            value="differences"
                            className={purchaseSubTabClass}
                        >
                            <ArrowLeftRight className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 text-left">
                                Différences
                            </span>
                            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-600 tabular-nums dark:bg-neutral-800 dark:text-neutral-300">
                                {purchaseData.differences.length}
                            </span>
                        </TabsTrigger>
                    </SessionTabTotalHint>

                    <SessionTabTotalHint
                        total={attendancesTotal}
                        formatCurrency={formatCurrency}
                        tone="blue"
                    >
                        <TabsTrigger
                            value="ouvriers"
                            className={purchaseSubTabClass}
                        >
                            <Users className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 text-left">
                                Ouvriers
                            </span>
                            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-600 tabular-nums dark:bg-neutral-800 dark:text-neutral-300">
                                {attendances.length}
                            </span>
                        </TabsTrigger>
                    </SessionTabTotalHint>
                </TabsList>
            </div>

            {/* Factures content */}
            <TabsContent value="factures" className="mt-0">
                <SessionInvoicesTable
                    invoices={purchaseData.invoices}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune facture d'achat trouvée pour cette session."
                    invoiceContext={
                        invoiceContext
                            ? { ...invoiceContext, type: 'purchase' }
                            : null
                    }
                />
            </TabsContent>

            {/* Différences content */}
            <TabsContent value="differences" className="mt-0">
                <SessionDifferencesTable
                    differences={purchaseData.differences}
                    receipts={purchaseData.receipts}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune différence trouvée pour cette session."
                    sessionId={sessionId}
                />
            </TabsContent>

            {/* Réceptions content */}
            <TabsContent value="receipts" className="mt-0">
                <SessionReceiptsTable
                    receipts={purchaseData.receipts}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucun bon de réception trouvé pour cette session."
                    receiptContext={receiptContext}
                    sales={sales}
                    session={session}
                />
            </TabsContent>

            {/* Ouvriers content */}
            <TabsContent value="ouvriers" className="mt-0">
                <SessionAttendancesTable
                    attendances={attendances}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucun pointage d'ouvriers trouvé pour cette session."
                    attendanceContext={attendanceContext}
                    sales={sales}
                    session={session}
                    customers={receiptContext?.customers ?? []}
                />
            </TabsContent>
        </Tabs>
    );
}

export default SessionPurchasesTab;
