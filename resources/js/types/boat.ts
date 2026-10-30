 

export interface Owner {
    id: number;
    name: string;
    type: string; // 'App\\Models\\Customer' or 'App\\Models\\Company'
}

export interface Boat {
    id: number;
    name: string;
    owner_id: number | null;
    owner_type: string | null;
    created_at: string;
    owner?: Owner | null;
}