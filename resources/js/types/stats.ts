export interface Stats {
    totalBoxes: number;
    totalHT: number;
    formattedNetToPay: string;
    formattedTotalHT: string;
    formattedTaxAndBoxes: string;
    formattedWeight: string;
    totalDifference?: number;
    formattedTotalDifference?: string;
    totalSalesDifference?: number;
    formattedTotalSalesDifference?: string;
}
