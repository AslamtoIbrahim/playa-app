export interface Stats {
    totalBoxes: number;
    totalHT: number;
    formattedNetToPay: string;
    formattedTotalHT: string;
    formattedTaxAndBoxes: string;
    formattedWeight: string;
    categoryBreakdown: {
        id: number;
        name: string;
        unit: string;
        total: number;
        sold: number;
        remaining: number;
    }[];
    totalDifference?: number;
    formattedTotalDifference?: string;
}
