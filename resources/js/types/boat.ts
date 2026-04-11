 
export interface Boat {
    id: number;
    name: string;
    account_id: number;
    created_at: string;
    account?: {
        name: string;
    };
}
