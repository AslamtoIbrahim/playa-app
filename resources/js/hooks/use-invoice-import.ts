import { InvoiceItem } from '@/types/invoice-item';
import { Boat } from '@/types/boat';
import { Item } from '@/types/item';

export function useInvoiceImport(boats: Boat[], items: Item[]) {
    const parsePasteData = (text: string): Partial<InvoiceItem>[] => {
        // 1. تقسيم النص لأسطر وتنظيف الفراغات والأسطر الخاوية
        const lines = text.trim().split('\n').filter((line) => {
            return line.trim() !== '';
        });

        // 2. معالجة كل سطر وتحويله لـ Object
        const parsedRows = lines.map((line): Partial<InvoiceItem> | null => {
            // تقسيم السطر بـ Tab أو الفاصلة
            const columns = line.split(/\t|,/).map(c => c.trim());
            
            // الترتيب: 0:Bateau, 1:Espèce, 2:Qty, 3:Price, 4:Unit, 5:Weight
            const [boatName, itemName, qte, prix, unit, weight] = columns;

            // البحث عن الباطو والنوع
            const boat = boats.find(b => b.name.toLowerCase() === boatName?.toLowerCase());
            const item = items.find(i => i.name.toLowerCase() === itemName?.toLowerCase());

            // إذا مالقاش الباطو والنوع (غالبا هادا سطر العناوين أو سطر خاوي)، كنرجعو null
            if (!boat || !item) {
                return null;
            }

            // تحديد الـ Unit
            let finalUnit = 'caisse'; 
            const cleanUnit = unit?.toLowerCase();
            
            if (cleanUnit === 'kg' || cleanUnit === 'kilo') {
                finalUnit = 'kg';
            }

            return {
                boat_id: boat.id,
                item_id: item.id,
                unit_count: parseFloat(qte?.replace(',', '.')) || 0,
                unit_price: parseFloat(prix?.replace(',', '.')) || 0,
                unit: finalUnit,
                weight: parseFloat(weight?.replace(',', '.')) || 0,
            } as Partial<InvoiceItem>;
        });

        // 3. الفلترة النهائية: كنحيدو كاع الـ null (السطور لي أهملنا بحال الـ Header)
        return parsedRows.filter((row): row is Partial<InvoiceItem> => {
            return row !== null;
        });
    };

    return { parsePasteData };
}