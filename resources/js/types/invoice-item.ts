import { Boat } from './boat';
import { Item } from './item';

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    item_id: number;
    boat_id: number;
    unit: string;
    unit_count: number;
    unit_price: number;
    weight: number;
    amount: number;
    created_at?: string;
    updated_at?: string;
    
    // العلاقات (Relationships) اللي كيجيو مع الـ Load
    boat?: Boat;
    item?: Item;
}