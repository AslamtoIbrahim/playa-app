import { Customer } from "./customers";
import { InvoiceItem } from "./invoice-item";
import { Item } from "./item"; // Matnsach t-importi Item ila kan 3ndek f file akhor

export interface Difference {
    id: number;
    invoice_item_id?: number | null;
    customer_id: number;
    item_id: number; // Field jdid jdid hna

    // الكمية الموزعة (Qte)
    unit_count: number;

    // الثمن الحقيقي (Prix Réel)
    real_price: number;

    // المجموع (unit_count * real_price)
    amount: number;

    // فرق السعر الإجمالي ((real_price - unit_price) * unit_count)
    total_diff: number;

    boxes: number; // Added boxes

    // الترتيب (Drag & Drop)
    position: number;

    // Relationships
    customer?: Customer;
    invoice_item?: InvoiceItem;
    item?: Item; // Relation m3a l-item bach t-affichi smiya f l-dashboard

    created_at: string;
    updated_at: string;
}

/**
 * Interface خاص بـ البيانات اللي كتمشي في الـ Request (Store/Update)
 */
export interface DifferenceRequest {
    invoice_item_id?: number | null;
    customer_id: number;
    item_id: number; // Darouri n-zidoh hna bach i-t-validate f l-backend
    unit_count: number;
    real_price: number;
    boxes: number;
}