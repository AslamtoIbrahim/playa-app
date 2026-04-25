// types/receipt.ts

import { Boat } from "./boat";
import { Customer } from "./customers";
import { DailySession } from "./daily-session";

export interface Receipt {
  id: number;
  date: string;
  customer_id: number;
  session_id: number;
  boat_id: number;
  quantity: number;
  total_amount: number;
  total_boxes: number;
  customer?: Customer;
  session?: DailySession;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ReceiptFormData {
  date: string;
  customer_id: string;
  session_id: string;
}

export interface ReceiptsIndexProps {
  receipts: {
    data: Receipt[];
    links: any[];
    meta: any;
  };
  customers: Customer[];
  sessions: DailySession[];
  boats: Boat[];
}