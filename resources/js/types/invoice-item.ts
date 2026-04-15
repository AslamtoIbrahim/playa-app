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
    boat?: Boat;
    item?: Item;
}


export interface InvoiceItemFormData {
    boat_id: number | string;
    item_id: number | string;
    unit_count: number | string;
    unit_price: number | string;
    weight: number | string;
    unit: string;
}