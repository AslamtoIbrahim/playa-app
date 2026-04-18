import type { Customer } from './customers';
import { InvoiceItem } from './invoice-item';
import type { OfficeRoom } from './office-room';

export interface Invoice {
    id: number;
    invoice_number: string;
    date: string;
    amount: number;
    weight: number | null; // ضروري نزيدو null
    tva: number;
    boxes: number;
    status: 'paid' | 'partially_paid' | 'unpaid' | 'pending';
    customer_id: number;
    customer?: Customer;
    office_room?: OfficeRoom; // هادي اللي كانت ناقصاك
    total_paid?: number;
    payments_sum_amount?: number;

    items?: InvoiceItem[];
}
