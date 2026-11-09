export interface ReceptionRecord {
    id: number;
    session_id: number;
    sale_item_id: number | null;
    session_date: string;
    origin: string;
    designation: string;
    weight: string;
    ttc: string;
    amount: string;
    margin_percentage: string;
    is_invoiced: boolean;
    invoice_reference: number | null;
}
