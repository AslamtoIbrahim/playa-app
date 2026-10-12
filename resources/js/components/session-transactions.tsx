import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionTabs } from '../hooks/use-session-tabs';
import { cn } from '@/lib/utils';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import type { Attendance } from '@/types/attendance';
import type { DailySession, SessionGroupData } from '@/types/daily-session';
import type { SessionSaleData } from '@/types/sale';

import { SessionPurchasesTab } from './session-purchases-tab';
import { SessionSalesTab } from './session-sales-tab';
import type { SessionAttendanceAddContextInput } from './session-attendances-table';
import type { SessionInvoiceAddContextInput } from './session-invoices-table';
import type { SessionReceiptAddContextInput } from './session-receipts-table';
import type { SessionSaleAddContextInput } from './session-sales-table';

export interface SessionTransactionsProps {
    sessionId: number;
    session?: DailySession | null;
    purchaseData: SessionGroupData;
    saleData: SessionSaleData;
    attendances: Attendance[];
    formatCurrency: (amount: number) => string;
    /** Contexte de la journée (session, zone, date) transmis aux tableaux de factures. */
    invoiceContext?: SessionInvoiceAddContextInput | null;
    /** Contexte de la journée (session, zone, date, client, bateau) transmis aux tableaux de bons. */
    receiptContext?: SessionReceiptAddContextInput | null;
    /** Contexte de la journée (session, zones, date) transmis au tableau des pointages. */
    attendanceContext?: SessionAttendanceAddContextInput | null;
    /** Contexte de la journée (session, date, client) transmis au tableau des ventes. */
    saleContext?: SessionSaleAddContextInput | null;
}

/*
|--------------------------------------------------------------------------
| Main tree: Achats / Ventes → sub-tabs → content
|--------------------------------------------------------------------------
*/
export function SessionTransactions({
    sessionId,
    session = null,
    purchaseData,
    saleData,
    attendances,
    formatCurrency,
    invoiceContext = null,
    receiptContext = null,
    attendanceContext = null,
    saleContext = null,
}: SessionTransactionsProps) {
    const {
        main: activeMainTab,
        purchase: activePurchaseTab,
        setMainTab,
        setPurchaseTab,
    } = useSessionTabs(sessionId);

    const mainTabClass = cn(
        'group min-h-20 cursor-pointer justify-start rounded-2xl border bg-linear-to-br px-4 py-3 text-left shadow-sm',
        'transition-all hover:-translate-y-0.5 hover:shadow-md data-[state=active]:shadow-sm',
    );

    return (
        <section className="w-full">
            <Tabs
                value={activeMainTab}
                onValueChange={setMainTab}
                className="flex w-full flex-col gap-2"
            >
                {/* Main tabs: always at the top */}
                <TabsList className="grid h-auto w-full grid-cols-2 gap-3 bg-transparent p-0 sm:gap-4">
                    <TabsTrigger
                        value="achats"
                        className={cn(
                            mainTabClass,
                            'border-slate-200/80 from-white to-slate-50 text-slate-700',
                            'hover:border-blue-300 hover:to-blue-50/70',
                            'data-[state=active]:border-blue-300 data-[state=active]:to-blue-50/80 data-[state=active]:text-blue-800',
                            'dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950 dark:text-neutral-200',
                            'dark:hover:border-blue-900 dark:hover:to-blue-950/30',
                            'dark:data-[state=active]:border-blue-500/50 dark:data-[state=active]:to-blue-950/40 dark:data-[state=active]:text-blue-300',
                        )}
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                            <ShoppingCart className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-bold sm:text-base">
                                Achats
                            </span>
                            <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-neutral-400">
                                Factures, réceptions et charges
                            </span>
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="ventes"
                        className={cn(
                            mainTabClass,
                            'border-slate-200/80 from-white to-slate-50 text-slate-700',
                            'hover:border-orange-300 hover:to-orange-50/70',
                            'data-[state=active]:border-orange-300 data-[state=active]:to-orange-50/80 data-[state=active]:text-orange-800',
                            'dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950 dark:text-neutral-200',
                            'dark:hover:border-orange-900 dark:hover:to-orange-950/30',
                            'dark:data-[state=active]:border-orange-500/50 dark:data-[state=active]:to-orange-950/40 dark:data-[state=active]:text-orange-300',
                        )}
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">
                            <ShoppingBag className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-bold sm:text-base">
                                Ventes
                            </span>
                            <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-neutral-400">
                                Produits et services vendus
                            </span>
                        </span>
                    </TabsTrigger>
                </TabsList>

                {/* Achats tree */}
                <TabsContent
                    value="achats"
                    className="mt-0 w-full rounded-2xl border border-slate-200/80 bg-linear-to-br from-white to-blue-50/40 p-4 shadow-sm sm:p-6 dark:border-neutral-800 dark:from-neutral-900 dark:to-blue-950/10"
                >
                    <SessionPurchasesTab
                        sessionId={sessionId}
                        activeTab={activePurchaseTab}
                        onTabChange={setPurchaseTab}
                        purchaseData={purchaseData}
                        attendances={attendances}
                        formatCurrency={formatCurrency}
                        invoiceContext={invoiceContext}
                        receiptContext={receiptContext}
                        attendanceContext={attendanceContext}
                        sales={saleData.sales ?? []}
                        session={session}
                    />
                </TabsContent>

                {/* Ventes tree */}
                <TabsContent
                    value="ventes"
                    className="mt-0 w-full rounded-2xl border border-slate-200/80 bg-linear-to-br from-white to-orange-50/40 p-4 shadow-sm sm:p-6 dark:border-neutral-800 dark:from-neutral-900 dark:to-orange-950/10"
                >
                    <SessionSalesTab
                        saleData={saleData}
                        formatCurrency={formatCurrency}
                        saleContext={saleContext}
                    />
                </TabsContent>
            </Tabs>
        </section>
    );
}

export default SessionTransactions;
