import type { Customer } from './customer';
import type { DailySession, SessionGroupData } from './daily-session';
import type { SaleItem } from './sale-item';

export interface Sale {
    id: number;
    date: string;

    // Type dyal l-bi3: 'normal' (kelyan 3adi) aw 'usine'
    type: 'normal' | 'usine';

    // Relationships IDs
    customer_id: number;
    session_id: number;
    created_by?: number;

    // Relationships Data (Loaded via with[])
    customer?: Customer;
    session?: DailySession;
    items?: SaleItem[];

    // Totals (Calculated in Backend)
    amount: number; // Mablagh l-idmali
    weight: number; // L-poids total
    boxes: number; // Total dyal sanda9

    // Timestamps
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

/**
 * Données groupées d'une session pour l'onglet Ventes :
 * factures / réceptions / différences + ventes directes.
 */
export type SessionSaleData = SessionGroupData & {
    sales?: Sale[];
};
