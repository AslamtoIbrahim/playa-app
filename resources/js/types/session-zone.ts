import { DailySession } from "./daily-session";
import { Zone } from "./zone";

export interface SessionZone {
    id: number;
    daily_session_id: number;
    zone_id: number;
    total_buy: number;
    total_sell: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    
    // Relationships (optional, for eager loading)
    daily_session?: DailySession;
    zone?: Zone;
}