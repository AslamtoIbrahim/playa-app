import type { Account } from './accounts';

export interface Facture {
    id: number;
    number: string;     // المرجع الفريد (e.g., FACT-2026-001)
    account_id: number;
    date: string;       // Date كيجي string من الـ API
    amount: number;     // الـ montant
    weight: number | null; // درتي ليه nullable() فـ الـ Migration
    status: 'unpaid' | 'paid' | 'partially_paid' | 'cancelled' | 'pending';
    total_paid?: number; 
    payments_sum_amount?: number;
    created_by: number;
    created_at: string;
    updated_at: string;
    
    // هادي باش نقدرو نجبدو سمية الـ Account فـ الجدول
    account?: Account; 
}