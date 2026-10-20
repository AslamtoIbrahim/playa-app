import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SaleStats } from '@/types/sale-stats';
import { Banknote, Diff, Package, Receipt, Scale, Users } from 'lucide-react';

const formatStatNumber = (value: number) =>
    value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).replace(/,/g, ' ');

/** Cartes de synthèse d'une vente. */
export function SaleStatsGrid({ stats }: { stats: SaleStats }) {
    const diffTone =
        stats.totalDiff < 0
            ? 'text-red-600 dark:text-red-400'
            : stats.totalDiff > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-slate-800 dark:text-neutral-100';

    const cardClass =
        'group overflow-hidden border-slate-200/80 bg-linear-to-br from-white to-orange-50/70 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:from-neutral-900 dark:to-orange-950/20';
    const iconClass =
        'rounded-xl bg-orange-100 p-1.5 text-orange-700 transition-transform group-hover:scale-110 dark:bg-orange-400/10 dark:text-orange-300';

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
            <Card className={cn(cardClass, 'lg:col-start-1 lg:row-start-1')}>
                <CardContent className="flex min-h-20 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total Caisses
                        </p>
                        <p className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-neutral-100">
                            {formatStatNumber(Math.abs(stats.totalBoxes))}
                        </p>
                    </div>
                    <div className={iconClass}><Package className="h-5 w-5" /></div>
                </CardContent>
            </Card>

            <Card className={cn(cardClass, 'lg:col-start-2 lg:row-start-1')}>
                <CardContent className="flex min-h-20 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total Poids
                        </p>
                        <p className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-neutral-100">
                            {formatStatNumber(Math.abs(stats.totalWeight))}
                            <span className="ml-1.5 text-xs font-medium text-slate-400">KG</span>
                        </p>
                    </div>
                    <div className={iconClass}><Scale className="h-5 w-5" /></div>
                </CardContent>
            </Card>

            <Card className={cn(cardClass, 'lg:col-start-3 lg:row-start-1')}>
                <CardContent className="flex min-h-20 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total Valeur
                        </p>
                        <p className="mt-2 text-xl font-bold tracking-tight text-orange-700 dark:text-orange-300">
                            {formatStatNumber(stats.totalValeur)}
                            <span className="ml-1.5 text-xs font-medium text-slate-400">DH</span>
                        </p>
                    </div>
                    <div className={iconClass}><Banknote className="h-5 w-5" /></div>
                </CardContent>
            </Card>

            <Card className={cn(cardClass, 'lg:col-start-1 lg:row-start-2')}>
                <CardContent className="flex min-h-20 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total Bons
                        </p>
                        <p className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-neutral-100">
                            {formatStatNumber(stats.totalCharges)}
                            <span className="ml-1.5 text-xs font-medium text-slate-400">DH</span>
                        </p>
                    </div>
                    <div className={iconClass}><Receipt className="h-5 w-5" /></div>
                </CardContent>
            </Card>

            <Card className={cn(cardClass, 'lg:col-start-2 lg:row-start-2')}>
                <CardContent className="flex min-h-20 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total Ouvriers
                        </p>
                        <p className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-neutral-100">
                            {formatStatNumber(stats.totalWorkers)}
                            <span className="ml-1.5 text-xs font-medium text-slate-400">DH</span>
                        </p>
                    </div>
                    <div className={iconClass}><Users className="h-5 w-5" /></div>
                </CardContent>
            </Card>

            <Card className={cn(cardClass, 'lg:col-start-3 lg:row-start-2')}>
                <CardContent className="flex min-h-20 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total Diff
                        </p>
                        <p className={cn('mt-2 text-xl font-bold tracking-tight', diffTone)}>
                            {stats.totalDiff > 0 ? '+' : ''}{formatStatNumber(stats.totalDiff)}
                            <span className="ml-1.5 text-xs font-medium text-slate-400">DH</span>
                        </p>
                    </div>
                    <div className={iconClass}><Diff className="h-5 w-5" /></div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-linear-to-br from-orange-600 via-orange-700 to-amber-800 py-2 text-white shadow-lg shadow-orange-900/15 transition-all hover:-translate-y-0.5 hover:shadow-xl lg:col-start-4 lg:row-span-2 lg:row-start-1 dark:from-orange-700 dark:via-orange-800 dark:to-amber-950">
                <CardContent className="flex min-h-full flex-col justify-between gap-3 p-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-orange-100/80">
                                Net à Payer
                            </p>
                            <p className="mt-4 text-xl font-black leading-tight tracking-tight tabular-nums sm:text-2xl">
                                {formatStatNumber(stats.netToPay)}
                                <span className="ml-1.5 text-xs font-medium text-orange-100/70">DH</span>
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/15 p-1.5 text-white">
                            <Banknote className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/20 pt-2">
                        <span className="text-[10px] font-semibold tracking-wide text-orange-100/80">
                            TVA (3%) + Caisses
                        </span>
                        <span className="text-xs font-medium text-white">
                            {formatStatNumber(Math.abs(stats.taxAmount) + Math.abs(stats.boxesFee))}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
