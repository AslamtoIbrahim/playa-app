import { Item } from '@/types/item';
import { ReceiptItem } from '@/types/receipt-item';

export function useReceiptImport(items: Item[]) {
    const parsePasteData = (text: string): Partial<ReceiptItem>[] => {
        // 1. تقسيم النص وتنظيف الأسطر
        const lines = text.trim().split('\n').filter((line) => {
            return line.trim() !== '';
        });

        // 2. معالجة كل سطر (الترتيب: Caisses -> Espèce -> Quantité -> Prix)
        const parsedRows = lines.map((line): Partial<ReceiptItem> | null => {
            const columns = line.split(/\t/).map(c => c.trim());

            // الترتيب حسب الـ Export اللي صيفطتي في الصورة
            const [caisses, itemName, qte, prix] = columns;

            // البحث عن السلعة
            const item = items.find(i => i.name.toLowerCase() === itemName?.toLowerCase());

            // إذا مالقاش السلعة (مثلاً سطر العناوين)، كنرجعو null
            if (!item) {
                console.warn(`Item non trouvé: "${itemName}"`);

                return null;
            }

            /**
             * هنا السر: كنستعملو المسميات اللي كيتسناها الـ Backend Controller
             * unit_count = qte
             * real_price = prix
             * box = caisses
             */
            return {
                item_id: item.id,
                box: parseInt(caisses) || 0,
                unit_count: parseFloat(qte?.replace(',', '.')) || 0,
                real_price: parseFloat(prix?.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0,
            } as Partial<ReceiptItem>;
        });

        // 3. الفلترة
        return parsedRows.filter((row): row is Partial<ReceiptItem> => {
            return row !== null;
        });
    };

    return { parsePasteData };
}