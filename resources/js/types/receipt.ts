// types/receipt.ts

import { Boat } from './boat';
import { Customer } from './customer';
import { SessionZone } from './session-zone';

export interface Receipt {
    id: number;
    date: string;
    customer_id: number;
    session_zone_id: number;
    boat_id: number;
    quantity: number;
    total_amount: number;
    total_boxes: number;
    boat?: Boat;
    customer?: Customer;
    session_zone?: SessionZone;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface ReceiptFormData {
    date: string;
    customer_id: string;
    session_zone_id: string;
}

export interface ReceiptsIndexProps {
    receipts: {
        data: Receipt[];
        links: any[];
        meta: any;
    };
    customers: Customer[];
    sessionZones: SessionZone[];
    boats: Boat[];
}
