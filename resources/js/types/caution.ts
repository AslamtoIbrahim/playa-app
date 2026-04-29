export interface Owner {
    id: number;
    name: string;
    type: string; // 'App\\Models\\Customer' or 'App\\Models\\Company'
}

export interface Caution {
    id: number;
    name: string;
    owner_id: number;
    owner_type: string;
    created_at: string;
    updated_at?: string;
    deleted_at?: string | null;
    
    // Relationship
    owner?: Owner;
}