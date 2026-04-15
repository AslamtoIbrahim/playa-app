import { Category } from "./category";

export interface Item {
    id: number;
    name: string;
    category_id: number;
    category?: Category; 
    created_at?: string;
    updated_at?: string;
}