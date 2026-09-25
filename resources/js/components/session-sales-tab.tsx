import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SessionSalesTab } from '../hooks/use-session-tabs';
import { cn } from '@/lib/utils';
import type { SessionSaleData } from '@/types/sale';

import { groupDifferencesByReport } from '@/lib/differences';

import { SessionDifferencesTable } from './session-differences-table';
import { SessionInvoicesTable } from './session-invoices-table';
import type { SessionInvoiceAddContextInput } from './session-invoices-table';
import { SessionReceiptsTable } from './session-receipts-table';
import type { SessionReceiptAddContextInput } from './session-receipts-table';
import { SessionSalesTable } from './session-sales-table';
import { SessionTabTotalHint } from './session-tab-total-hint';
export interface SessionSalesTabProps {
    activeTab: SessionSalesTab;
    onTabChange: (value: string) => void;
    saleData: SessionSaleData;
    formatCurrency: (amount: number) => string;
    /** Contexte de la journée : création + actions de ligne sur les factures. */
    invoiceContext?: SessionInvoiceAddContextInput | null;
    /** Contexte de la journée : création + actions de ligne sur les bons de réception. */
    receiptContext?: SessionReceiptAddContextInput | null;
}

export function SessionSalesTab({
    activeTab,
    onTabChange,
    saleData,
    formatCurrency,
    invoiceContext = null,
    receiptContext = null,
}: SessionSalesTabProps) {
    const differenceReports = groupDifferencesByReport(saleData.differences);

    const invoicesTotal = saleData.invoices.reduce(
        (sum, invoice) => sum + Number(invoice.amount ?? 0),
        0,
    );
    const receiptsTotal = saleData.receipts.reduce(
        (sum, receipt) => sum + Number(receipt.total_amount ?? 0),
        0,
    );
    const differencesTotal = (saleData.differences ?? []).reduce(
        (sum, difference) => sum + Number(difference.total_diff ?? 0),
        0,
    );
    const salesTotal = (saleData.sales ?? []).reduce(
        (sum, sale) => sum + Number(sale.amount ?? 0),
        0,
    );

    const saleSubTabClass = cn(
        'h-10 cursor-pointer rounded-lg border border-transparent px-5 text-sm font-medium',
        'bg-transparent text-neutral-500 shadow-none transition-colors',
        'hover:bg-orange-50 hover:text-orange-700',
        'aria-selected:border-orange-500',
        'aria-selected:bg-orange-50',
        'aria-selected:text-orange-700',
        'aria-selected:shadow-none',
        'dark:text-neutral-400',
        'dark:hover:bg-orange-500/10',
        'dark:hover:text-orange-400',
        'dark:aria-selected:border-orange-500',
        'dark:aria-selected:bg-orange-500/10',
        'dark:aria-selected:text-orange-400',
    );

    return (
        <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="flex w-full flex-col"
        >
            {/* Ventes sub-tabs */}
            <div className="mb-5 overflow-x-auto">
                <TabsList className="flex h-auto w-full min-w-max justify-between gap-2 bg-transparent p-0">
                    <SessionTabTotalHint
                        total={invoicesTotal}
                        formatCurrency={formatCurrency}
                        tone="orange"
                    >
                        <TabsTrigger
                            value="destination-factures"
                            className={saleSubTabClass}
                        >
                            Destination factures
                            <span className="ml-2 text-xs opacity-70">
                                {saleData.invoices.length}
                            </span>
                        </TabsTrigger>
                    </SessionTabTotalHint>

                    <SessionTabTotalHint
                        total={receiptsTotal}
                        formatCurrency={formatCurrency}
                        tone="orange"
                    >
                        <TabsTrigger
                            value="destination-receptions"
                            className={saleSubTabClass}
                        >
                            Destination réceptions
                            <span className="ml-2 text-xs opacity-70">
                                {saleData.receipts.length}
                            </span>
                        </TabsTrigger>
                    </SessionTabTotalHint>

                    <SessionTabTotalHint
                        total={differencesTotal}
                        formatCurrency={formatCurrency}
                        tone="orange"
                    >
                        <TabsTrigger
                            value="differences"
                            className={saleSubTabClass}
                        >
                            Différences
                            <span className="ml-2 text-xs opacity-70">
                                {differenceReports.length}
                            </span>
                        </TabsTrigger>
                    </SessionTabTotalHint>

                    <SessionTabTotalHint
                        total={salesTotal}
                        formatCurrency={formatCurrency}
                        tone="orange"
                    >
                        <TabsTrigger
                            value="ventes-directes"
                            className={saleSubTabClass}
                        >
                            Ventes directes
                            <span className="ml-2 text-xs opacity-70">
                                {saleData.sales?.length ?? 0}
                            </span>
                        </TabsTrigger>
                    </SessionTabTotalHint>
                </TabsList>
            </div>

            {/* Destination factures content */}
            <TabsContent value="destination-factures" className="mt-0">
                <SessionInvoicesTable
                    invoices={saleData.invoices}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune vente avec destination facture trouvée."
                    title="Destination factures"
                    invoiceContext={
                        invoiceContext
                            ? { ...invoiceContext, type: 'sale' }
                            : null
                    }
                />
            </TabsContent>

            {/* Destination réceptions content */}
            <TabsContent value="destination-receptions" className="mt-0">
                <SessionReceiptsTable
                    receipts={saleData.receipts}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune vente avec destination réception trouvée."
                    receiptContext={receiptContext}
                />
            </TabsContent>

            {/* Différences content */}
            <TabsContent value="differences" className="mt-0">
                <SessionDifferencesTable
                    differences={saleData.differences}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune différence de vente enregistrée pour cette session."
                />
            </TabsContent>

            {/* Ventes directes content */}
            <TabsContent value="ventes-directes" className="mt-0">
                <SessionSalesTable
                    sales={saleData.sales ?? []}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune vente directe enregistrée pour cette session."
                />
            </TabsContent>
        </Tabs>
    );
}

export default SessionSalesTab;
