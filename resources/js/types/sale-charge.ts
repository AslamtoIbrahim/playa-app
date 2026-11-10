import type { Category } from './category';
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

    // Manually selected category. Null means the category is inferred from
    // the receipt items (single category, Merge, or empty).
    category_id: number | null;

    // Amount of the receipt assigned to this sale
    amount: number;

    // Relationships loaded from backend
    sale?: Sale;
    receipt?: Receipt;
    category?: Category;

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
    category_id: number | null;
    amount: number;
}
