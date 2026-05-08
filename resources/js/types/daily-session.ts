import { Difference } from "./difference";
import { Invoice } from "./invoice";
import { Receipt } from "./receipt";
import { Zone } from "./zone";

export type SessionStatus = 'open' | 'closed';

export interface DailySession {
    id: number;
    session_date: string;
    status: SessionStatus;
    zones?: Zone[];
    total_buy: number;
    total_sell: number;
    closed_at: string | null;
    closed_by: number | null;
    created_at: string;
    updated_at: string;
}

// Ha houwa l-type lli khass bach n-farslo l-data (Achat/Vente)
export interface SessionGroupData {
    invoices: Invoice[]; // Ghadi n-stakhdmou any[] hna aw t-importi l-Interface dyal Invoice
    differences: Difference[];
    receipts: Receipt[];
    total: number;
}

// Props lli kiy-wslo l-page SessionsShow
export interface SessionDetailProps {
    session: DailySession;
    purchaseData: SessionGroupData;
    saleData: SessionGroupData;
}