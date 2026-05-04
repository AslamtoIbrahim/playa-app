import { Worker } from "./worker";

export interface AttendanceItem {
    id: number;
    attendance_id: number;
    worker_id: number;
    wage: number;
    is_present: boolean;
    worker?: Worker;
    created_at?: string;
    updated_at?: string;
}