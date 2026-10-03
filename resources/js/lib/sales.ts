import type { InvoiceItem } from '@/types/invoice-item';

/**
 * Ligne de facture d'achat réduite à ce dont la vente a besoin : la quantité
 * facturée et les distributions déjà enregistrées vers des ventes.
 */
type SellableInvoiceItem = Pick<
    InvoiceItem,
    'unit_count' | 'unit_price' | 'sale_items'
>;

/**
 * Quantité déjà vendue d'une ligne de facture.
 *
 * Les différences de prix n'entrent pas dans ce calcul : elles répartissent le
 * prix, pas la marchandise. Une ligne peut donc avoir une différence et être
 * malgré tout entièrement vendable.
 */
export function computeInvoiceItemSoldCount(
    item?: SellableInvoiceItem | null,
): number {
    if (!item) {
        return 0;
    }

    return (item.sale_items ?? []).reduce((sum, saleItem) => {
        return sum + (Number(saleItem.unit_count) || 0);
    }, 0);
}

/**
 * Quantité encore vendable d'une ligne de facture d'achat.
 *
 * C'est exactement le « RESTE » affiché dans le dialogue de vente : la
 * quantité facturée diminuée des ventes déjà enregistrées. La valeur est
 * négative si les ventes dépassent la facture (cas anormal, signalé en rouge).
 */
export function computeInvoiceItemRemainingCount(
    item?: SellableInvoiceItem | null,
): number {
    if (!item) {
        return 0;
    }

    return Number(item.unit_count) - computeInvoiceItemSoldCount(item);
}

/**
 * Écart réel d'une vente : (prix réel - prix unitaire facturé) × quantité.
 *
 * Même formule que celle appliquée côté serveur par `SaleItem::boot()`, ce qui
 * permet d'afficher le total en direct avant l'enregistrement.
 */
export function computeSaleItemDiff(
    unitCount: number | string,
    realPrice: number | string,
    unitPrice: number | string,
): number {
    const count = Number(unitCount) || 0;
    const real = Number(realPrice) || 0;
    const base = Number(unitPrice) || 0;

    return (real - base) * count;
}

/**
 * Libellé d'une vente dans les listes de choix : identifiant + client, pour
 * distinguer deux ventes du même client dans la même journée.
 */
export function formatSaleLabel(
    saleId: number,
    customerName?: string | null,
): string {
    return `#${saleId} — ${customerName || 'Client inconnu'}`;
}