import type { Attendance } from '@/types/attendance';
import type { Invoice } from '@/types/invoice';
import type { InvoiceItem } from '@/types/invoice-item';
import type { Receipt } from '@/types/receipt';
import type { SaleCharge } from '@/types/sale-charge';
import type { Sale } from '@/types/sale';
import type { SaleItem } from '@/types/sale-item';
import type { SaleWorker } from '@/types/sale-worker';

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
 * Valeur d'une ligne de vente, hors écart.
 *
 * `unit_count × real_price` contient déjà l'écart (`total_diff`), puisque
 * `real_price × qté = prix facturé × qté + écart`. La valeur affichée est donc
 * ce montant diminué de l'écart, c'est-à-dire la quantité au prix facturé :
 * l'écart reste exposé à part (colonne « Diff Total ») sans double comptage.
 */
export function computeSaleItemValue(
    item: Pick<SaleItem, 'unit_count' | 'real_price' | 'total_diff'>,
): number {
    return (
        (Number(item.unit_count) || 0) * (Number(item.real_price) || 0) -
        (Number(item.total_diff) || 0)
    );
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
 * Net à payer d'une vente, calculé exactement comme la carte « Net à Payer »
 * (`useSaleCalculations`) : c'est le total de toutes les cartes de synthèse.
 *
 * La valeur est isolée de l'écart, des bons et de la part ouvrière (chacun a sa
 * propre carte), la taxe de 3 % porte sur cette valeur seule, puis l'écart, les
 * bons, la part ouvrière et les frais de caisse sont repris une seule fois.
 *
 * C'est le « Montant » affiché dans la colonne Montant de la table des ventes.
 */
export function computeSaleNetToPayFromSale(
    sale: Pick<
        Sale,
        'amount' | 'boxes' | 'items' | 'charges' | 'workers'
    >,
): number {
    const totalDiff = computeSaleTotalDiff(sale.items);
    const totalCharges = computeSaleChargesTotal(sale.charges);
    const totalWorkers = computeSaleWorkersTotal(sale.workers);

    // Valeur hors écart, hors bons et hors part ouvrière : chaque part a sa
    // propre carte et est reprise une seule fois dans le net à payer.
    const totalValeur =
        (Number(sale.amount) || 0) - totalDiff - totalCharges - totalWorkers;

    return computeSaleNetToPay(
        totalValeur,
        totalDiff,
        computeSaleTax(totalValeur),
        computeSaleBoxesFee(sale.boxes),
        totalCharges + totalWorkers,
    );
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
 * Net à payer d'une vente : la valeur totale, majorée de l'écart des lignes, de
 * la taxe de 3 %, des frais de caisse et des parts complémentaires (bons
 * imputés et part ouvrière).
 *
 * La valeur passée ici est isolée de ces parts : le net à payer reflète donc le
 * total de toutes les cartes de synthèse, sans double comptage.
 */
export function computeSaleNetToPay(
    totalValeur: number,
    totalDiff: number,
    taxAmount: number,
    boxesFee: number,
    extraParts: number = 0,
): number {
    return (
        (Number(totalValeur) || 0) +
        (Number(totalDiff) || 0) +
        (Number(taxAmount) || 0) +
        (Number(boxesFee) || 0) +
        (Number(extraParts) || 0)
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

/**
 * Montant d'un pointage déjà réparti entre des ventes.
 *
 * C'est la somme des `SaleWorkers.amount` du pointage : la part de son
 * `total_wage` déjà affectée à des ventes (clients) de la journée.
 */
export function computeAttendanceSoldAmount(
    attendance?: Pick<Attendance, 'sale_workers'> | null,
): number {
    if (!attendance) {
        return 0;
    }

    return (attendance.sale_workers ?? []).reduce((sum, worker) => {
        return sum + (Number(worker.amount) || 0);
    }, 0);
}

/**
 * Montant encore répartissable d'un pointage.
 *
 * C'est exactement le « RESTE » affiché dans le dialogue d'imputation : le
 * `total_wage` diminué des parts déjà enregistrées. La valeur est négative si
 * les parts dépassent le pointage (cas anormal, signalé en rouge).
 */
export function computeAttendanceRemainingAmount(
    attendance?: Pick<Attendance, 'total_wage' | 'sale_workers'> | null,
): number {
    if (!attendance) {
        return 0;
    }

    return (
        Number(attendance.total_wage) - computeAttendanceSoldAmount(attendance)
    );
}

/**
 * Montant total des parts ouvrières imputées à une vente.
 *
 * Source de vérité des statistiques de vente : la somme des
 * `SaleWorkers.amount` rattachés à la vente. Le `total_wage` du pointage ne
 * doit jamais être utilisé ici, car un pointage peut être réparti sur
 * plusieurs ventes (pas de double comptage).
 */
export function computeSaleWorkersTotal(
    workers?: Pick<SaleWorker, 'amount'>[] | null,
): number {
    if (!workers) {
        return 0;
    }

    return workers.reduce((sum, worker) => {
        return sum + (Number(worker.amount) || 0);
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
