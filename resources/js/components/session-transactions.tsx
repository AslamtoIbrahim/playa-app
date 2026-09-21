import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Attendance } from '@/types/attendance';
import type { SessionGroupData } from '@/types/daily-session';
import type { SessionSaleData } from '@/types/sale';

import { SessionPurchasesTab } from './session-purchases-tab';
import { SessionSalesTab } from './session-sales-tab';
import type { SessionInvoiceAddContextInput } from './session-invoices-table';

export interface SessionTransactionsProps {
    purchaseData: SessionGroupData;
    saleData: SessionSaleData;
    attendances: Attendance[];
    formatCurrency: (amount: number) => string;
    /** Contexte de la journée (session, zone, date) transmis aux tableaux de factures. */
    invoiceContext?: SessionInvoiceAddContextInput | null;
}

/*
|--------------------------------------------------------------------------
| Main tree: Achats / Ventes → sub-tabs → content
|--------------------------------------------------------------------------
*/
export function SessionTransactions({
    purchaseData,
    saleData,
    attendances,
    formatCurrency,
    invoiceContext = null,
}: SessionTransactionsProps) {
    const mainTabClass = cn(
        'cursor-pointer rounded-xl border bg-white px-6 py-2 text-base font-semibold shadow-none',
        'transition-colors data-[state=active]:shadow-none',
        'dark:bg-neutral-900',
    );

    return (
        <section className="w-full">
            <Tabs defaultValue="achats" className="flex w-full flex-col gap-2">
                {/* Main tabs: always at the top */}
                <TabsList className="grid h-auto w-full grid-cols-2 gap-3 bg-transparent p-0 sm:gap-5">
                    <TabsTrigger
                        value="achats"
                        className={cn(
                            mainTabClass,
                            'border-neutral-200 text-neutral-500',
                            'hover:border-blue-400 hover:text-blue-700',
                            'data-[state=active]:border-blue-500',
                            'data-[state=active]:bg-blue-50',
                            'data-[state=active]:text-blue-700',
                            'dark:border-neutral-800',
                            'dark:data-[state=active]:border-blue-500',
                            'dark:data-[state=active]:bg-blue-500/10',
                            'dark:data-[state=active]:text-blue-400',
                        )}
                    >
                        Achats
                    </TabsTrigger>

                    <TabsTrigger
                        value="ventes"
                        className={cn(
                            mainTabClass,
                            'border-neutral-200 text-neutral-500',
                            'hover:border-orange-400 hover:text-orange-700',
                            'data-[state=active]:border-orange-500',
                            'data-[state=active]:bg-orange-50',
                            'data-[state=active]:text-orange-700',
                            'dark:border-neutral-800',
                            'dark:data-[state=active]:border-orange-500',
                            'dark:data-[state=active]:bg-orange-500/10',
                            'dark:data-[state=active]:text-orange-400',
                        )}
                    >
                        Ventes
                    </TabsTrigger>
                </TabsList>

                {/* Achats tree */}
                <TabsContent
                    value="achats"
                    className="mt-0 w-full rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 dark:border-blue-500/30 dark:bg-neutral-900"
                >
                    <SessionPurchasesTab
                        purchaseData={purchaseData}
                        attendances={attendances}
                        formatCurrency={formatCurrency}
                        invoiceContext={invoiceContext}
                    />
                </TabsContent>

                {/* Ventes tree */}
                <TabsContent
                    value="ventes"
                    className="mt-0 w-full rounded-2xl border border-orange-200 bg-white p-4 sm:p-6 dark:border-orange-500/30 dark:bg-neutral-900"
                >
                    <SessionSalesTab
                        saleData={saleData}
                        formatCurrency={formatCurrency}
                        invoiceContext={invoiceContext}
                    />
                </TabsContent>
            </Tabs>
        </section>
    );
}

export default SessionTransactions;
