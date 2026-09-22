import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { SessionSaleData } from '@/types/sale';

import { SessionDifferencesTable } from './session-differences-table';
import { SessionInvoicesTable } from './session-invoices-table';
import type { SessionInvoiceAddContextInput } from './session-invoices-table';
import { SessionReceiptsTable } from './session-receipts-table';
import type { SessionReceiptAddContextInput } from './session-receipts-table';
import { SessionSalesTable } from './session-sales-table';

export interface SessionSalesTabProps {
    saleData: SessionSaleData;
    formatCurrency: (amount: number) => string;
    /** Contexte de la journée : création + actions de ligne sur les factures. */
    invoiceContext?: SessionInvoiceAddContextInput | null;
    /** Contexte de la journée : création + actions de ligne sur les bons de réception. */
    receiptContext?: SessionReceiptAddContextInput | null;
}

export function SessionSalesTab({
    saleData,
    formatCurrency,
    invoiceContext = null,
    receiptContext = null,
}: SessionSalesTabProps) {
    const saleSubTabClass = cn(
        'h-10 cursor-pointer rounded-lg border border-transparent px-5 text-sm font-medium',
        'bg-transparent text-neutral-500 shadow-none transition-colors',
        'hover:bg-orange-50 hover:text-orange-700',
        'data-[state=active]:border-orange-500',
        'data-[state=active]:bg-orange-50',
        'data-[state=active]:text-orange-700',
        'data-[state=active]:shadow-none',
        'dark:text-neutral-400',
        'dark:hover:bg-orange-500/10',
        'dark:hover:text-orange-400',
        'dark:data-[state=active]:border-orange-500',
        'dark:data-[state=active]:bg-orange-500/10',
        'dark:data-[state=active]:text-orange-400',
    );

    return (
        <Tabs
            defaultValue="destination-factures"
            className="flex w-full flex-col"
        >
            {/* Ventes sub-tabs */}
            <div className="mb-5 overflow-x-auto">
                <TabsList className="flex h-auto w-full min-w-max justify-between gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="destination-factures"
                        className={saleSubTabClass}
                    >
                        Destination factures
                        <span className="ml-2 text-xs opacity-70">
                            {saleData.invoices.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="destination-receptions"
                        className={saleSubTabClass}
                    >
                        Destination réceptions
                        <span className="ml-2 text-xs opacity-70">
                            {saleData.receipts.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="differences"
                        className={saleSubTabClass}
                    >
                        Différences
                        <span className="ml-2 text-xs opacity-70">
                            {saleData.differences.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="ventes-directes"
                        className={saleSubTabClass}
                    >
                        Ventes directes
                        <span className="ml-2 text-xs opacity-70">
                            {saleData.sales?.length ?? 0}
                        </span>
                    </TabsTrigger>
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
