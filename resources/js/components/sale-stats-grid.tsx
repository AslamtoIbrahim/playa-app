import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SaleStats } from '@/types/sale-stats';
import { Banknote, Diff, Package, Receipt, Scale, Users } from 'lucide-react';

/**
 * Cartes de synthèse d'une vente.
 *
 * Six compteurs occupent une grille de quatre colonnes sur deux lignes
 * (caisses, poids, valeur, bons, part ouvrière et écart total), et la carte
 * « Net à Payer » complète la quatrième colonne en s'étendant sur les deux
 * lignes : elle présente la valeur, majorée de l'écart, de la taxe de 3 % et
 * des frais de caisse, dont la taxe et les frais de caisse sont repris sur la
 * ligne du bas. Les bons (SaleCharges) et la part ouvrière (SaleWorkers) ont
 * désormais leur propre carte : la part ouvrière provient de la somme des
 * `SaleWorkers.amount` de la vente, jamais du `total_wage` du pointage, qui
 * peut être réparti sur plusieurs ventes.
 */
export function SaleStatsGrid({ stats }: { stats: SaleStats }) {
    const diffTone = cn(
        stats.totalDiff < 0
            ? 'text-red-600 dark:text-red-400'
            : stats.totalDiff > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-slate-700 dark:text-slate-100',
    );

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
            {/* Total Caisses */}
            <Card className="flex h-20 flex-col justify-center border-amber-200 bg-white py-0 shadow-none lg:col-start-1 lg:row-start-1 dark:border-amber-800 dark:bg-slate-900">
                <CardContent className="p-4 py-2">
                    <p className="mb-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Total Caisses
                    </p>

                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-100">
                            {stats.totalBoxes}
                        </p>
                        <Package className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Total Poids */}
            <Card className="flex h-20 flex-col justify-center border-amber-200 bg-white py-0 shadow-none lg:col-start-2 lg:row-start-1 dark:border-amber-800 dark:bg-slate-900">
                <CardContent className="p-4 py-2">
                    <p className="mb-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Total Poids
                    </p>

                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-100">
                            {stats.formattedWeight}
                        </p>
                        <span className="text-xs font-semibold text-slate-600 opacity-50 dark:text-slate-300">
                            Kg
                        </span>
                        <Scale className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Total Valeur */}
            <Card className="flex h-20 flex-col justify-center border-amber-200 bg-white py-0 shadow-none lg:col-start-3 lg:row-start-1 dark:border-amber-800 dark:bg-slate-900">
                <CardContent className="p-4 py-2">
                    <p className="mb-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Total Valeur
                    </p>

                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold tracking-tight text-slate-700 dark:text-slate-100">
                            {stats.formattedTotalValeur}
                        </p>
                        <span className="text-xs font-semibold text-slate-600 opacity-50 dark:text-slate-300">
                            DH
                        </span>
                        <Banknote className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Dont bons : bons de réception imputés dans la valeur */}
            <Card className="flex h-20 flex-col justify-center border-amber-200 bg-white py-0 shadow-none lg:col-start-1 lg:row-start-2 dark:border-amber-800 dark:bg-slate-900">
                <CardContent className="p-4 py-2">
                    <p className="mb-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Dont Bons
                    </p>

                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold tracking-tight text-slate-700 dark:text-slate-100">
                            {stats.formattedTotalCharges}
                        </p>
                        <span className="text-xs font-semibold text-slate-600 opacity-50 dark:text-slate-300">
                            DH
                        </span>
                        <Receipt className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Dont ouvriers : parts salaires imputées dans la valeur */}
            <Card className="flex h-20 flex-col justify-center border-amber-200 bg-white py-0 shadow-none lg:col-start-2 lg:row-start-2 dark:border-amber-800 dark:bg-slate-900">
                <CardContent className="p-4 py-2">
                    <p className="mb-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Dont Ouvriers
                    </p>

                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold tracking-tight text-slate-700 dark:text-slate-100">
                            {stats.formattedTotalWorkers}
                        </p>
                        <span className="text-xs font-semibold text-slate-600 opacity-50 dark:text-slate-300">
                            DH
                        </span>
                        <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Total Diff */}
            <Card className="flex h-20 flex-col justify-center border-amber-200 bg-white py-0 shadow-none lg:col-start-3 lg:row-start-2 dark:border-amber-800 dark:bg-slate-900">
                <CardContent className="p-4 py-2">
                    <p className="mb-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Total Diff
                    </p>

                    <div className="flex items-center gap-2">
                        <p
                            className={cn(
                                'text-xl font-bold tracking-tight',
                                diffTone,
                            )}
                        >
                            {stats.formattedTotalDiff}
                        </p>
                        <span className="text-xs font-semibold text-slate-600 opacity-50 dark:text-slate-300">
                            DH
                        </span>
                        <Diff className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Net à Payer : Valeur + Diff + Taxe 3% + Caisses */}
            <Card className="flex border-none bg-stone-900 py-0 text-white shadow-none lg:col-start-4 lg:row-span-2 lg:row-start-1 lg:h-full">
                <CardContent className="flex flex-1 flex-col justify-between gap-2 p-4 py-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold tracking-wider uppercase opacity-50">
                            Net à Payer
                        </p>
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold text-lime-200 uppercase">
                            Total
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <p className="text-xl font-black tracking-tight lg:text-2xl">
                            {stats.formattedNetToPay}
                        </p>
                        <span className="text-[10px] font-light opacity-60">
                            DH
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
                        <span className="text-[8px] font-bold uppercase opacity-50">
                            TVA (3%) + Caisses
                        </span>
                        <span className="text-[12px] font-medium text-slate-400 dark:text-neutral-400">
                            {stats.formattedTaxAndBoxes}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
