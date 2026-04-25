import { Item } from "./item";
import { Boat } from "./boat";

export interface ReceiptItem {
    id: number;
    receipt_id: number;
    item_id: number;
    boat_id: number; // حيت فـ الـ Table Row كاين الباطو، خاصو يكون فـ الـ Schema أو كـ Foreign Key

    // الحقول الأساسية
    unit_count: number;    // الكمية (الوزن غالباً)
    real_price: number;    // الثمن الحقيقي
    box: number;           // عدد الصناديق
    total_diff: number;    // الفرق الإجمالي أو القيمة الإجمالية

    // التوقيت
    created_at: string;
    updated_at: string;

    // العلاقات (Optional - كيجيو مع الـ Eager Loading فـ Laravel)
    item?: Item;
    boat?: Boat;
}

// هاد النوع كينفع ملي كنكونو كنصاوبو Item جديد (قبل ما يتكريا فـ الداتابيز)
export type ReceiptItemInput = Omit<ReceiptItem, 'id' | 'created_at' | 'updated_at' | 'total_diff'>;