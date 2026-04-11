import { Category } from "./category";

export interface Item {
    id: number;
    name: string;
    category_id: number;
    // هادي كنزيدوها حيت استعملنا with('category') في الـ Controller
    category?: Category; 
    created_at?: string;
    updated_at?: string;
}