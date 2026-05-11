import { AttendanceItem } from './attendance-item';
import { SessionZone } from './session-zone';

export interface Attendance {
    id: number;
    date: string;
    session_zone_id: number;
    total_wage: number;
    session_zone?: SessionZone;
    items?: AttendanceItem[];
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface AttendanceFormData {
    session_zone_id: string;
}

export interface AttendancesIndexProps {
    attendances: {
        data: Attendance[];
        links: any[];
        meta: any;
    };
    sessionZones: SessionZone[];
}
