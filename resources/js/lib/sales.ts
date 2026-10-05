import type { InvoiceItem } from '@/types/invoice-item';
import type { SaleItem } from '@/types/sale-item';

/**
 * Taux de TVA appliqué aux ventes, aligné sur `Invoice::calculateTotals()`.
 */
export const SALE_TAX_RATE = 0.03;

/**
 * Frais de caisse : 1 DH par caisse, comme sur les factures d'achat.
 */
export const SALE_BOX_FEE = 1;

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
 * Écart total d'une vente : la somme des écarts de ses lignes.
 *
 * C'est exactement la somme de la colonne « Diff Total » de la fiche de vente,
 * chaque ligne portant l'écart entre le prix réel pratiqué et le prix unitaire
 * de la facture d'achat d'origine.
 */
export function computeSaleTotalDiff(
    items?: Pick<SaleItem, 'total_diff'>[] | null,
): number {
    if (!items) {
        return 0;
    }

    return items.reduce((sum, item) => {
        return sum + (Number(item.total_diff) || 0);
    }, 0);
}

/**
 * Taxe (3%) appliquée au montant HT d'une vente.
 *
 * La vente est enregistrée hors taxe côté serveur (`Sale::calculateTotals()`) :
 * ce montant est donc purement informatif, comme la TVA d'une facture d'achat.
 */
export function computeSaleTax(
    totalHT: number,
    rate: number = SALE_TAX_RATE,
): number {
    return (Number(totalHT) || 0) * rate;
}

/**
 * Frais de caisse d'une vente : 1 DH par caisse.
 *
 * Même règle que la facture d'achat, qui ajoute `1 DH × caisses` au net à
 * payer (`Invoice::calculateTotals()`).
 */
export function computeSaleBoxesFee(
    totalBoxes: number,
    feePerBox: number = SALE_BOX_FEE,
): number {
    return (Number(totalBoxes) || 0) * feePerBox;
}

/**
 * Net à payer d'une vente : la valeur totale, majorée de l'écart des lignes,
 * de la taxe de 3 % et des frais de caisse.
 */
export function computeSaleNetToPay(
    totalValeur: number,
    totalDiff: number,
    taxAmount: number,
    boxesFee: number,
): number {
    return (
        (Number(totalValeur) || 0) +
        (Number(totalDiff) || 0) +
        (Number(taxAmount) || 0) +
        (Number(boxesFee) || 0)
    );
}
