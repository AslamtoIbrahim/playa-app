import type { Difference } from '@/types/difference';
import type { InvoiceItem } from '@/types/invoice-item';

/**
 * Un rapport d'écarts regroupe les différences d'un même client, bateau et
 * date de facture : c'est exactement la maille présentée sur la page
 * `/differences` et attendue par `/differences/report`.
 */
export interface DifferenceReport {
    /** Clé d'agrégation `customerId-date-boatId` (clé React de la ligne). */
    key: string;
    customerId: number | null;
    customerName: string;
    boatId: number | null;
    boatName: string;
    /** Date de facture pure `YYYY-MM-DD`, utilisée dans la query du rapport. */
    invoiceDate: string | null;
    totalDiff: number;
    itemsCount: number;
}

/** Réduit une date (datetime SQL ou ISO) au format `YYYY-MM-DD`. */
export const toDateOnly = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    const pureDate = value.replace('T', ' ').split(' ')[0];

    return /^\d{4}-\d{2}-\d{2}$/.test(pureDate) ? pureDate : null;
};

/**
 * Agrège une liste de différences par client / bateau / date de facture,
 * comme le fait `DifferenceController::index` pour les archives.
 * L'ordre des rapports suit l'ordre d'apparition des différences.
 */
export function groupDifferencesByReport(
    differences: Difference[],
): DifferenceReport[] {
    const groups = new Map<string, DifferenceReport>();

    differences.forEach((difference) => {
        const invoiceDate = toDateOnly(difference.invoice_item?.invoice?.date);

        const boatId =
            difference.invoice_item?.boat_id ??
            difference.invoice_item?.boat?.id ??
            null;

        const customerId =
            difference.customer_id ?? difference.customer?.id ?? null;

        const key = `${customerId}-${invoiceDate}-${boatId}`;
        const existing = groups.get(key);

        if (existing) {
            existing.totalDiff += Number(difference.total_diff);
            existing.itemsCount += 1;

            return;
        }

        groups.set(key, {
            key,
            customerId,
            customerName: difference.customer?.name || '---',
            boatId,
            boatName: difference.invoice_item?.boat?.name || '---',
            invoiceDate,
            totalDiff: Number(difference.total_diff),
            itemsCount: 1,
        });
    });

    return Array.from(groups.values());
}
/**
 * Total de la répartition d'un svelte de facture, tel qu'il est présenté par le
 * `DifferenceDialog` : la somme des écarts des différences réparties, diminuée
 * des commissions déjà enregistrées sur les arrivages.
 *
 * La cellule « Différence » de la grille et l'en-tête du dialog appellent tous
 * les deux cette fonction, pour qu'ils affichent toujours le même montant.
 */
export function computeInvoiceItemDifferenceTotal(
    item?: Pick<InvoiceItem, 'differences' | 'receipt_items'> | null,
): number {
    if (!item) {
        return 0;
    }

    const differencesTotal = (item.differences ?? []).reduce(
        (sum, difference) => {
            return sum + (Number(difference.total_diff) || 0);
        },
        0,
    );

    const commissionsTotal = (item.receipt_items ?? [])
        .filter((receiptItem) => receiptItem.type === 'commission')
        .reduce((sum, receiptItem) => {
            return (
                sum +
                (Number(receiptItem.unit_count) *
                    Number(receiptItem.real_price) || 0)
            );
        }, 0);

    return differencesTotal - commissionsTotal;
}

/** Formate un montant de différence en dirhams avec deux décimales. */
export function formatDifferenceAmount(value: number): string {
    return value.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
