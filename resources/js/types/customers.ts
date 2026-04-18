export interface Customer {
    id: number;
    name: string;
    title: string;
    type: string; // مثلاً: 'Grossiste', 'Détaillant', 'Bateau'...
    created_by: number;
    created_at: string;
    updated_at: string;
}
