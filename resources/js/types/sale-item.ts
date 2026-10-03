import type { InvoiceItem } from './invoice-item';
import type { Sale } from './sale';

/**
 * Distribution d'une ligne de facture d'achat vers une vente.
 *
 * Une ligne de facture peut être vendue en plusieurs fois (et donc à
 * plusieurs clients) jusqu'à épuisement de sa quantité.
 */
export interface SaleItem {
    id: number;
    sale_id: number;
    invoice_item_id: number;

    // Quantité vendue sur cette ligne
    unit_count: number;

    // Prix réel pratiqué
    real_price: number;

    // Écart réel = (real_price - invoice_item.unit_price) * unit_count
    total_diff: number;

    // Relationships loaded from backend
    sale?: Sale;
    invoice_item?: InvoiceItem;

    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/**
 * Charge utile envoyée au backend lors de la vente d'une ligne de facture.
 */
export interface SaleItemRequest {
    sale_id: number;
    invoice_item_id: number;
    unit_count: number;
    real_price: number;
}