import type { Caution } from '@/types/caution';
import type { Billable } from '@/types/invoice';

/**
 * Uniformise un type polymorphique.
 * Selon la façon dont la valeur a été enregistrée, on peut trouver
 * `App\Models\Customer` ou la variante échappée `App\\Models\\Customer`.
 */
export function normalizeMorphType(type: string): string {
    return type.replace(/\\+/g, '\\');
}

/**
 * Cautions appartenant au compte sélectionné (client ou société).
 * L'id seul ne suffit pas : les ids des clients et des sociétés se chevauchent,
 * on compare donc aussi le type du propriétaire.
 */
export function filterCautionsByBillable(
    cautions: Caution[],
    billable: Billable | null,
): Caution[] {
    const billableType = billable?.type;
    const billableId = billable?.id;

    if (!billable || !billableType || billableId === undefined) {
        return [];
    }

    return cautions.filter((caution) => {
        const isSameOwner = Number(caution.owner_id) === Number(billableId);
        const isSameType =
            normalizeMorphType(caution.owner_type) ===
            normalizeMorphType(billableType);

        return isSameOwner && isSameType;
    });
}
