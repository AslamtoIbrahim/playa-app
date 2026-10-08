import type { Attendance } from './attendance';
import type { Sale } from './sale';

/**
 * Amount of an attendance wage assigned to a sale.
 *
 * An attendance (total_wage) can be split across several sales of the same
 * session until exhausted. The dialog shows the remaining amount live.
 */
export interface SaleWorker {
    id: number;
    sale_id: number;
    attendance_id: number;

    // Amount of the attendance wage assigned to this sale
    amount: number;

    // Relationships loaded from backend
    sale?: Sale;
    attendance?: Attendance;

    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/**
 * Payload sent to the backend when assigning an attendance wage to a sale.
 */
export interface SaleWorkerRequest {
    sale_id: number;
    attendance_id: number;
    amount: number;
}
