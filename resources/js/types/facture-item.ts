export interface FactureItem {
    id: number;
    facture_id: number;
    species: string;       // النوع (Calamar, etc.)
    weight: number;
    pu_facturation: number; // ثمن الفاتورة
    pu_reel: number;        // ثمن المكتب
    diff: number;           // الفرق
    total_diff: number;     // المجموع
}