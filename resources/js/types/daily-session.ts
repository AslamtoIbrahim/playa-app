export type SessionStatus = 'open' | 'closed';

export interface DailySession {
    id: number;
    session_date: string;
    status: SessionStatus;
    total_buy: number;
    total_sell: number;
    closed_at: string | null;
    closed_by: number | null;
    created_at: string;
    updated_at: string;
}