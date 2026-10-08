import type { Invoice } from '@/types/invoice';
import type { InvoiceItem } from '@/types/invoice-item';
import type { Receipt } from '@/types/receipt';
import type { SaleCharge } from '@/types/sale-charge';
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

/**
 * Montant d'un bon déjà imputé à des ventes.
 *
 * C'est la somme des `SaleCharges.amount` du bon : la part de son
 * `total_amount` déjà vendue à des ventes (clients) de la journée.
 */
export function computeReceiptSoldAmount(
    receipt?: Pick<Receipt, 'sale_charges'> | null,
): number {
    if (!receipt) {
        return 0;
    }

    return (receipt.sale_charges ?? []).reduce((sum, charge) => {
        return sum + (Number(charge.amount) || 0);
    }, 0);
}

/**
 * Montant encore vendable d'un bon de réception.
 *
 * C'est exactement le « RESTE » affiché dans le dialogue de vente du bon : le
 * `total_amount` diminué des charges déjà enregistrées. La valeur est négative
 * si les charges dépassent le bon (cas anormal, signalé en rouge).
 */
export function computeReceiptRemainingAmount(
    receipt?: Pick<Receipt, 'total_amount' | 'sale_charges'> | null,
): number {
    if (!receipt) {
        return 0;
    }

    return Number(receipt.total_amount) - computeReceiptSoldAmount(receipt);
}

/**
 * Montant total des bons imputés à une vente.
 *
 * C'est la part des charges dans le `amount` enregistré par
 * `Sale::calculateTotals()` : les lignes de facture et les charges ne se
 * recouvrent jamais, il n'y a donc pas de double comptage.
 */
export function computeSaleChargesTotal(
    charges?: Pick<SaleCharge, 'amount'>[] | null,
): number {
    if (!charges) {
        return 0;
    }

    return charges.reduce((sum, charge) => {
        return sum + (Number(charge.amount) || 0);
    }, 0);
}

/** Totals of the quantity of a purchase invoice that is still sellable. */
export interface InvoiceRemainingTotals {
    /** Net amount of the remainder (HT + 3 % tax + 1 DH per box). */
    amount: number;

    /** Weight of the remainder, prorated per line. */
    weight: number;

    /** Boxes of the remainder, prorated per line. */
    boxes: number;

    /** Number of invoice lines that still carry a sellable quantity. */
    remainingLines: number;

    /** Whether at least one unit is still sellable. */
    hasRemaining: boolean;
}

/**
 * Totals of the unsold remainder of a purchase invoice.
 *
 * Only the quantity still sellable per line is counted: quantities already
 * distributed to sales are excluded, exactly like `InvoiceController::sell()`.
 * Weight and boxes are prorated by the remaining ratio on each line, and the
 * amount mirrors `Invoice::calculateTotals()` (HT + 3 % tax + 1 DH per box) so
 * it stays comparable with the invoice's own `amount`.
 */
export function computeInvoiceRemainingTotals(
    invoice?: Pick<Invoice, 'items'> | null,
): InvoiceRemainingTotals {
    let remainingHt = 0;
    let weight = 0;
    let boxes = 0;
    let remainingLines = 0;

    for (const item of invoice?.items ?? []) {
        const remaining = Math.max(computeInvoiceItemRemainingCount(item), 0);

        if (remaining <= 0) {
            continue;
        }

        const unitCount = Number(item.unit_count) || 0;

        remainingLines += 1;
        remainingHt += remaining * (Number(item.unit_price) || 0);

        if (unitCount > 0) {
            const ratio = remaining / unitCount;

            weight += (Number(item.weight) || 0) * ratio;
            boxes += (Number(item.box) || 0) * ratio;
        }
    }

    const roundedWeight = Math.round(weight * 100) / 100;
    const roundedBoxes = Math.round(boxes * 100) / 100;
    const amount =
        remainingHt +
        computeSaleTax(remainingHt) +
        computeSaleBoxesFee(roundedBoxes);

    return {
        amount: Math.round(amount * 100) / 100,
        weight: roundedWeight,
        boxes: roundedBoxes,
        remainingLines,
        hasRemaining: remainingLines > 0,
    };
}
