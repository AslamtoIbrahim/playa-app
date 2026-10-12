export interface SaleStats {
    /**
     * Valeur totale des lignes de la vente, hors bons et hors part ouvrière :
     * ces deux parts ont leurs propres cartes et sont reprises par le net à payer.
     */
    totalValeur: number;
    totalBoxes: number;
    totalWeight: number;

    /** Part des bons de réception imputés dans la vente (hors valeur totale). */
    totalCharges: number;

    /**
     * Part des salaires ouvriers imputés dans la vente, hors valeur totale
     * (somme des `SaleWorkers.amount` de la vente).
     */
    totalWorkers: number;

    /** Somme des écarts des lignes de la vente (« Diff Total »). */
    totalDiff: number;

    /** Taxe de 3 % appliquée à la valeur totale. */
    taxAmount: number;

    /** Frais de caisse : 1 DH par caisse. */
    boxesFee: number;

    /**
     * Net à payer affiché : valeur + écart + taxe + frais de caisse + bons +
     * part ouvrière, soit le total de toutes les cartes de synthèse.
     */
    netToPay: number;

    formattedNetToPay: string;
    formattedTotalValeur: string;
    formattedTotalCharges: string;
    formattedTotalWorkers: string;
    formattedBoxes: string;
    formattedWeight: string;

    /** Écart total signé (`+` devant un écart positif). */
    formattedTotalDiff: string;
    formattedTaxAmount: string;

    /** Taxe + frais de caisse : le complément affiché sous le net à payer. */
    formattedTaxAndBoxes: string;
}
