import type { SessionSaleData } from '@/types/sale';

import { SessionSalesTable } from './session-sales-table';
import type { SessionSaleAddContextInput } from './session-sales-table';

export interface SessionSalesTabProps {
    saleData: SessionSaleData;
    formatCurrency: (amount: number) => string;
    /** Session context: creation + row actions on the sales. */
    saleContext?: SessionSaleAddContextInput | null;
}

/**
 * Content of the "Ventes" main tab.
 *
 * The sales of the daily session are listed directly in a single table: the
 * creation dialog sits in the table toolbar (top right) and each row exposes
 * its own edit / delete actions. The session and its date are already known,
 * so they are locked and never asked again.
 */
export function SessionSalesTab({
    saleData,
    formatCurrency,
    saleContext = null,
}: SessionSalesTabProps) {
    return (
        <SessionSalesTable
            sales={saleData.sales ?? []}
            formatCurrency={formatCurrency}
            emptyMessage="Aucune vente enregistrée pour cette session."
            title="Ventes"
            saleContext={saleContext}
        />
    );
}

export default SessionSalesTab;
