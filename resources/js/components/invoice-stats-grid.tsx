import { Card, CardContent } from '@/components/ui/card';
import { currency } from '@/lib/utils';
import { Stats } from '@/types/stats';
import { Banknote, Diff, Package, Scale, Wallet } from 'lucide-react';

export function InvoiceStatsGrid({ stats }: { stats: Stats }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
            <Card className="group overflow-hidden border-slate-200/80 bg-linear-to-br from-white to-slate-50 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md lg:order-4 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
                <CardContent className="flex min-h-16 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total Caisses
                        </p>
                        <p className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-neutral-100">
                            {stats.totalBoxes}
                        </p>
                    </div>
                    <div className="rounded-xl bg-amber-100 p-1.5 text-amber-700 transition-transform group-hover:scale-110 dark:bg-amber-400/10 dark:text-amber-300">
                        <Package className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card className="group overflow-hidden border-slate-200/80 bg-linear-to-br from-white to-slate-50 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md lg:order-3 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
                <CardContent className="flex min-h-16 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total Poids
                        </p>
                        <p className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-neutral-100">
                            {stats.formattedWeight}
                            <span className="ml-1.5 text-xs font-medium text-slate-400">
                                KG
                            </span>
                        </p>
                    </div>
                    <div className="rounded-xl bg-violet-100 p-1.5 text-violet-700 transition-transform group-hover:scale-110 dark:bg-violet-400/10 dark:text-violet-300">
                        <Scale className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card className="group overflow-hidden border-slate-200/80 bg-linear-to-br from-white to-slate-50 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md lg:order-2 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
                <CardContent className="flex min-h-16 items-center justify-between p-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                            Total HT
                        </p>
                        <p className="mt-2 text-xl font-bold tracking-tight text-blue-700 dark:text-blue-300">
                            {currency(stats.totalHT)}
                            <span className="ml-1.5 text-xs font-medium text-slate-400">
                                DH
                            </span>
                        </p>
                    </div>
                    <div className="rounded-xl bg-blue-100 p-1.5 text-blue-700 transition-transform group-hover:scale-110 dark:bg-blue-400/10 dark:text-blue-300">
                        <Banknote className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 py-2 text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:shadow-xl lg:order-1 dark:from-slate-800 dark:via-neutral-900 dark:to-indigo-950">
                <CardContent className="flex min-h-16 flex-col justify-between p-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-slate-300">
                                Net à Payer
                            </p>
                            <p className="mt-2 text-xl font-black tracking-tight">
                                {stats.formattedNetToPay}
                                <span className="ml-1.5 text-xs font-medium text-slate-300">
                                    DH
                                </span>
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-1.5 text-emerald-300">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px]">
                        <span className="text-slate-300">
                            TVA (3%) + Caisses
                        </span>
                        <span className="font-semibold text-emerald-300">
                            +{stats.formattedTaxAndBoxes} DH
                        </span>
                    </div>
                </CardContent>
            </Card>

            {stats.formattedTotalDifference !== undefined && (
                <Card className="group overflow-hidden border-slate-200/80 bg-linear-to-br from-white to-rose-50/70 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md lg:order-5 dark:border-neutral-800 dark:from-neutral-900 dark:to-rose-950/20">
                    <CardContent className="flex min-h-16 items-center justify-between p-3">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                                Total Différences
                            </p>
                            <p className="mt-2 text-xl font-bold tracking-tight text-rose-700 dark:text-rose-300">
                                {stats.formattedTotalDifference}
                                <span className="ml-1.5 text-xs font-medium text-slate-400">
                                    DH
                                </span>
                            </p>
                        </div>
                        <div className="rounded-xl bg-rose-100 p-1.5 text-rose-700 transition-transform group-hover:scale-110 dark:bg-rose-400/10 dark:text-rose-300">
                            <Diff className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
