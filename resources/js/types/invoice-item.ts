import { Boat } from './boat';
import { Difference } from './difference';
import type { Invoice } from './invoice';
import { Item } from './item';
import { Category } from './category';
import { ReceiptItem } from './receipt-item';
import { SaleItem } from './sale-item';

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    category_id: number;
    boat_id: number;
    unit: string;
    box: number;
    unit_count: number;
    unit_price: number;
    weight: number;
    amount: number;
    created_at?: string;
    updated_at?: string;
    boat?: Boat;
    item?: Item;
    category?: Category;
    invoice?: Invoice;

    differences?: Difference[];
    receipt_items?: ReceiptItem[];
    sale_items?: SaleItem[];
}

export interface InvoiceItemFormData {
    boat_id: number | string;
    category_id: number | string;
    unit_count: number | string;
    unit_price: number | string;
    weight: number | string;
    unit: string;
    box: number | string;
}
