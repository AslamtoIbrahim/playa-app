import { Boat } from './boat';
import { Item } from './item';

export interface SaleItem {
    id: number;
    sale_id: number;
    item_id: number;
    boat_id: number;
    unit: string;
    unit_count: number;
    unit_price: number;
    weight: number;
    amount: number;
    box: number;
    position: number;
    // Relationships loaded from backend
    item?: Item;
    boat?: Boat;
    created_at?: string;
    updated_at?: string;
}