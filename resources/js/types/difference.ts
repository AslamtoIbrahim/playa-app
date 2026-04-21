import { Customer } from "./customers";
import { InvoiceItem } from "./invoice-item";

export interface Difference {
    id: number;
    invoice_item_id: number;
    customer_id: number;
    
    // الكمية الموزعة (Qte)
    unit_count: number;
    
    // الثمن الحقيقي (Prix Réel)
    real_price: number;
    
    // المجموع (unit_count * real_price)
    amount: number;
    
    // فرق السعر الإجمالي ((real_price - unit_price) * unit_count)
    total_diff: number;
    
    // الترتيب (Drag & Drop)
    position: number;

    // Relationships (اختياريين حسب واش داير load في الـ Controller)
    customer?: Customer;
    invoice_item?: InvoiceItem;

    created_at: string;
    updated_at: string;
}

/**
 * Interface خاص بـ البيانات اللي كتمشي في الـ Request (Store/Update)
 */
export interface DifferenceRequest {
    invoice_item_id: number;
    customer_id: number;
    unit_count: number;
    real_price: number;
}