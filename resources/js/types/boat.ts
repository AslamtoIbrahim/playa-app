 

export interface Owner {
    id: number;
    name: string;
    type: string; // 'App\\Models\\Customer' or 'App\\Models\\Company'
}

export interface Boat {
    id: number;
    name: string;
    owner_id: number;
    owner_type: string;
    created_at: string;
    owner?: Owner;
}