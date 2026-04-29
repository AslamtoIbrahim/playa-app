import { Caution } from './caution';
import type { InvoiceItem } from './invoice-item';
import type { OfficeRoom } from './office-room';

// هادي هي الواجهة اللي كتمثل الـ Polymorphic Relation (billable)
export interface Billable {
    id: number;
    name: string;
    // 'App\\Models\\Customer' أو 'App\\Models\\Company'
    type?: string; 
}

export interface Invoice {
    id: number;
    invoice_number: string;
    date: string;
    
    // النوع: واش بيع (Sale) أو شراء (Purchase)
    type: 'sale' | 'purchase';
    
    // Polymorphic Fields
    billable_id: number;
    billable_type: string;
    billable?: Billable; // هنا فين كيرجع الـ Model المرتبط

    // الارتباطات الأخرى
    session_id: number;
    office_room_id: number | null;
    office_room?: OfficeRoom;

    caution_id: number | null; // Zid hada
    caution?: Caution;       // O hada bach n-affichiw smya
    
    // الحسابات المالية
    amount: number;
    weight: number | null;
    tva: number;
    boxes: number;
    
    // الحالة والبيانات الوصفية
    status: 'paid' | 'partially_paid' | 'unpaid' | 'pending';
    created_by?: number;
    total_paid?: number;
    payments_sum_amount?: number;

    // التفاصيل
    items?: InvoiceItem[];
    created_at: string;
    updated_at: string;
}