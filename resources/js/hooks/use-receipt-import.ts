import { Item } from '@/types/item';
import { ReceiptItem } from '@/types/receipt-item';

export function useReceiptImport(items: Item[]) {
    const parsePasteData = (text: string): Partial<ReceiptItem>[] => {
        // 1. تقسيم النص لأسطر وتنظيف الفراغات
        const lines = text.trim().split('\n').filter((line) => {
            return line.trim() !== '';
        });

        // 2. معالجة كل سطر وتحويله لـ Object
        const parsedRows = lines.map((line): Partial<ReceiptItem> | null => {
            const columns = line.split(/\t|,/).map((c) => {
                return c.trim();
            });

            // الترتيب المتوقع حسب الجدول: 0:Caisses, 1:Espèce, 2:Quantité, 3:Prix Unitaire
            const [caisses, itemName, qte, prix] = columns;

            // البحث عن النوع (Espèce) في قائمة السلع
            const item = items.find((i) => {
                return i.name.toLowerCase() === itemName?.toLowerCase();
            });

            // إذا مالقاش النوع (غالباً سطر العناوين)، كنرجعو null
            if (!item) {
                return null;
            }

            return {
                item_id: item.id,
                boxes: parseInt(caisses) || 0,
                qty: parseFloat(qte?.replace(',', '.')) || 0,
                price: parseFloat(prix?.replace(',', '.')) || 0,
            } as Partial<ReceiptItem>;
        });

        // 3. الفلترة النهائية لإزالة السطور الفارغة أو غير المتطابقة
        return parsedRows.filter((row): row is Partial<ReceiptItem> => {
            return row !== null;
        });
    };

    return { parsePasteData };
}