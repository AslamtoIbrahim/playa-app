import { Category } from './category';

export interface Item {
    id: number;
    name: string;
    category_id: number;
    category?: Category;
    default_price?: number;
    created_at?: string;
    updated_at?: string;
}
