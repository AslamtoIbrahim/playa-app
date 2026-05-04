import { AttendanceItem } from "./attendance-item";
import { DailySession } from "./daily-session";

export interface Attendance {
    id: number;
    date: string; 
    daily_session_id: number;
    total_wage: number;
    session?: DailySession;
    items?: AttendanceItem[];
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}
 
export interface AttendanceFormData {
    daily_session_id: string;
}

export interface AttendancesIndexProps {
    attendances: {
        data: Attendance[];
        links: any[];  
        meta: any;
    };
    sessions: DailySession[];
}