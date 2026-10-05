export interface SaleStats {
    /** Valeur totale des lignes de la vente (le HT enregistré côté serveur). */
    totalValeur: number;
    totalBoxes: number;
    totalWeight: number;

    /** Somme des écarts des lignes de la vente (« Diff Total »). */
    totalDiff: number;

    /** Taxe de 3 % appliquée à la valeur totale. */
    taxAmount: number;

    /** Frais de caisse : 1 DH par caisse. */
    boxesFee: number;

    /**
     * Net à payer affiché : valeur + écart + taxe + frais de caisse.
     *
     * Attention, il diffère de `sale.amount`, qui reste la valeur HT
     * enregistrée par `Sale::calculateTotals()`.
     */
    netToPay: number;

    formattedNetToPay: string;
    formattedTotalValeur: string;
    formattedBoxes: string;
    formattedWeight: string;

    /** Écart total signé (`+` devant un écart positif). */
    formattedTotalDiff: string;
    formattedTaxAmount: string;

    /** Taxe + frais de caisse : le complément affiché sous le net à payer. */
    formattedTaxAndBoxes: string;
}
