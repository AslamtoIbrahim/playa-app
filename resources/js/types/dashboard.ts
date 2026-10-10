/**
 * Dashboard payload types.
 *
 * All figures come from real operations: purchases are purchase invoices
 * (invoices.type = purchase), sales are rows of the sales table.
 */

export interface DashboardStats {
    purchaseCount: number;
    saleCount: number;
    sessionCount: number;
    openSessionCount: number;
    totalBuy: number;
    totalSell: number;
    totalMargin: number;
}

/** One point of the daily buy / sell / margin series. */
export interface DashboardTrendPoint {
    date: string;
    buy: number;
    sell: number;
    margin: number;
}

/** Recent purchase invoice row. */
export interface DashboardPurchase {
    id: number;
    invoice_number: string;
    date: string;
    owner: string | null;
    amount: number;
    boxes: number;
    weight: number;
}

/** Recent sale row. */
export interface DashboardSale {
    id: number;
    date: string;
    customer: string | null;
    type: 'normal' | 'usine';
    amount: number;
    boxes: number;
    weight: number;
}

export interface DashboardProps {
    stats: DashboardStats;
    trend: DashboardTrendPoint[];
    recentPurchases: DashboardPurchase[];
    recentSales: DashboardSale[];
}
