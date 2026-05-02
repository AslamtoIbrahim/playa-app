import { SaleItem } from '@/types/sale-item';
import { Boat } from '@/types/boat';
import { Item } from '@/types/item';

export function useSaleImport(boats: Boat[], items: Item[]) {
    const parsePasteData = (text: string): Partial<SaleItem>[] => {
        // 1. Split lines and clean whitespace
        const lines = text.trim().split('\n').filter((line) => {
            {
                return line.trim() !== '';
            }
        });

        // 2. Map lines to objects
        const parsedRows = lines.map((line): Partial<SaleItem> | null => {
            {
                // Split by Tab or Comma
                const columns = line.split(/\t|,/).map(c => {
                    {
                        return c.trim();
                    }
                });
                
                // Expected Order: 0:Bateau, 1:Espèce, 2:Qty, 3:Price, 4:Unit, 5:Weight
                const [boatName, itemName, qte, prix, unit, weight] = columns;

                // Search for Boat and Item (Case insensitive)
                const boat = boats.find(b => {
                    {
                        return b.name.toLowerCase() === boatName?.toLowerCase();
                    }
                });

                const item = items.find(i => {
                    {
                        return i.name.toLowerCase() === itemName?.toLowerCase();
                    }
                });

                // Skip header or invalid rows
                if (!boat || !item) {
                    {
                        return null;
                    }
                }

                // Determine Unit
                let finalUnit = 'caisse'; 
                const cleanUnit = unit?.toLowerCase();
                
                if (cleanUnit === 'kg' || cleanUnit === 'kilo') {
                    {
                        finalUnit = 'kg';
                    }
                }

                // Numeric parsing helpers
                const parseNum = (val: string) => {
                    {
                        return parseFloat(val?.replace(',', '.')) || 0;
                    }
                };

                const unitCount = parseNum(qte);
                const finalWeight = parseNum(weight);

                return {
                    boat_id: boat.id,
                    item_id: item.id,
                    unit_count: unitCount,
                    unit_price: parseNum(prix),
                    unit: finalUnit,
                    weight: finalWeight,
                    // If weight is missing but it's "caisse", apply default multiplier
                    box: finalUnit === 'caisse' ? unitCount : 1,
                } as Partial<SaleItem>;
            }
        });

        // 3. Final filtering of nulls
        const result = parsedRows.filter((row): row is Partial<SaleItem> => {
            {
                return row !== null;
            }
        });

        return result;
    };

    return { parsePasteData };
}