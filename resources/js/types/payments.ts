import type { Facture } from './invoice';

export interface Payment {
    id: number;
    facture_id: number;
    amount: number;
    payment_date: string;
    method: 'cash' | 'check' | 'transfer' | 'card';
    reference: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;

    // العلاقة مع الفاتورة باش نجبدو رقم الفاتورة وسمية الكليان
    facture?: Facture;
}