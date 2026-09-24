import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Attendance } from '@/types/attendance';
import type { SessionGroupData } from '@/types/daily-session';

import { SessionAttendancesTable } from './session-attendances-table';
import type { SessionAttendanceAddContextInput } from './session-attendances-table';
import { groupDifferencesByReport } from '@/lib/differences';

import { SessionDifferencesTable } from './session-differences-table';
import { SessionInvoicesTable } from './session-invoices-table';
import type { SessionInvoiceAddContextInput } from './session-invoices-table';
import { SessionReceiptsTable } from './session-receipts-table';
import type { SessionReceiptAddContextInput } from './session-receipts-table';
import { SessionTableShell } from './session-table-shell';

export interface SessionPurchasesTabProps {
    purchaseData: SessionGroupData;
    attendances: Attendance[];
    formatCurrency: (amount: number) => string;
    /** Contexte de la journée : création + actions de ligne sur les factures. */
    invoiceContext?: SessionInvoiceAddContextInput | null;
    /** Contexte de la journée : création + actions de ligne sur les bons de réception. */
    receiptContext?: SessionReceiptAddContextInput | null;
    /** Contexte de la journée : création d'une feuille de pointage pour les zones de la journée. */
    attendanceContext?: SessionAttendanceAddContextInput | null;
}

function ChargesPlaceholder() {
    return (
        <SessionTableShell>
            <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Aucune charge enregistrée pour le moment.
            </div>
        </SessionTableShell>
    );
}

export function SessionPurchasesTab({
    purchaseData,
    attendances,
    formatCurrency,
    invoiceContext = null,
    receiptContext = null,
    attendanceContext = null,
}: SessionPurchasesTabProps) {
    const differenceReports = groupDifferencesByReport(
        purchaseData.differences ?? [],
    );

    const purchaseSubTabClass = cn(
        'h-10 cursor-pointer rounded-lg border border-transparent px-4 text-sm font-medium',
        'bg-transparent text-neutral-500 shadow-none transition-colors',
        'hover:bg-blue-50 hover:text-blue-700',
        'data-[state=active]:border-blue-500',
        'data-[state=active]:bg-blue-50',
        'data-[state=active]:text-blue-700',
        'data-[state=active]:shadow-none',
        'dark:text-neutral-400',
        'dark:hover:bg-blue-500/10',
        'dark:hover:text-blue-400',
        'dark:data-[state=active]:border-blue-500',
        'dark:data-[state=active]:bg-blue-500/10',
        'dark:data-[state=active]:text-blue-400',
    );

    return (
        <Tabs defaultValue="factures" className="flex w-full flex-col gap-6">
            {/* Achats sub-tabs */}
            <div className="mb-5 overflow-x-auto">
                <TabsList className="flex h-auto w-full min-w-max justify-between gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="factures"
                        className={purchaseSubTabClass}
                    >
                        Factures
                        <span className="ml-2 text-xs opacity-70">
                            {purchaseData.invoices.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="receipts"
                        className={purchaseSubTabClass}
                    >
                        Réceptions
                        <span className="ml-2 text-xs opacity-70">
                            {purchaseData.receipts.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="differences"
                        className={purchaseSubTabClass}
                    >
                        Différences
                        <span className="ml-2 text-xs opacity-70">
                            {differenceReports.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="ouvriers"
                        className={purchaseSubTabClass}
                    >
                        Ouvriers
                        <span className="ml-2 text-xs opacity-70">
                            {attendances.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="charges"
                        className={purchaseSubTabClass}
                    >
                        Charges
                        <span className="ml-2 text-xs opacity-70">0</span>
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* Factures content */}
            <TabsContent value="factures" className="mt-0">
                <SessionInvoicesTable
                    invoices={purchaseData.invoices}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune facture d'achat trouvée pour cette session."
                    title="Factures d'achat"
                    invoiceContext={
                        invoiceContext
                            ? { ...invoiceContext, type: 'purchase' }
                            : null
                    }
                />
            </TabsContent>

            {/* Réceptions content */}
            <TabsContent value="receipts" className="mt-0">
                <SessionReceiptsTable
                    receipts={purchaseData.receipts}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucun bon de réception trouvé pour cette session."
                    receiptContext={receiptContext}
                />
            </TabsContent>

            {/* Différences content */}
            <TabsContent value="differences" className="mt-0">
                <SessionDifferencesTable
                    differences={purchaseData.differences}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune différence enregistrée pour cette session."
                />
            </TabsContent>

            {/* Ouvriers content */}
            <TabsContent value="ouvriers" className="mt-0">
                <SessionAttendancesTable
                    attendances={attendances}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucun pointage d'ouvriers trouvé pour cette session."
                    attendanceContext={attendanceContext}
                />
            </TabsContent>

            {/* Charges content */}
            <TabsContent value="charges" className="mt-0">
                <ChargesPlaceholder />
            </TabsContent>
        </Tabs>
    );
}

export default SessionPurchasesTab;
