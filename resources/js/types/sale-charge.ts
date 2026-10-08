import type { Receipt } from './receipt';
import type { Sale } from './sale';

/**
 * Amount of a receipt sold/assigned to a sale.
 *
 * A receipt (total_amount) can be split across several sales of the same
 * session until exhausted. The dialog shows the remaining amount live.
 */
export interface SaleCharge {
    id: number;
    sale_id: number;
    receipt_id: number;

    // Amount of the receipt assigned to this sale
    amount: number;

    // Relationships loaded from backend
    sale?: Sale;
    receipt?: Receipt;

    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/**
 * Payload sent to the backend when charging a receipt to a sale.
 */
export interface SaleChargeRequest {
    sale_id: number;
    receipt_id: number;
    amount: number;
}
