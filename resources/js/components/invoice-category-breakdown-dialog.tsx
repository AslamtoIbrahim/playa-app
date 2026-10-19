import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { formatNumber } from '@/lib/utils';
import { Package } from 'lucide-react';
import { useState } from 'react';
import type { Stats } from '@/types/stats';

interface Props {
    categories: Stats['categoryBreakdown'];
}

export function InvoiceCategoryBreakdownDialog({ categories }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button type="button" className="w-full text-left lg:order-4">
                    <Card className="group overflow-hidden border-emerald-200/80 bg-linear-to-br from-white to-emerald-50/70 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-900 dark:from-neutral-900 dark:to-emerald-950/20">
                        <CardContent className="flex min-h-16 items-center justify-between p-3">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                                    Totaux par catégorie
                                </p>
                                <p className="mt-2 text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                                    {formatNumber(categories.length)}
                                    <span className="ml-1.5 text-xs font-medium text-slate-400">
                                        catégories
                                    </span>
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-100 p-1.5 text-emerald-700 transition-transform group-hover:scale-110 dark:bg-emerald-400/10 dark:text-emerald-300">
                                <Package className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </button>
            </DialogTrigger>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-emerald-100 p-0 sm:max-w-5xl dark:border-emerald-950 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="border-b border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-teal-50 p-4 pr-12 text-left dark:border-emerald-950 dark:from-emerald-950/50 dark:via-neutral-950 dark:to-teal-950/30">
                    <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-neutral-100">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                            <Package className="size-4" />
                        </span>
                        Résumé des catégories
                    </DialogTitle>
                    <DialogDescription className="pl-11 text-xs text-slate-500 dark:text-neutral-400">
                        Quantités achetées, vendues et restantes par catégorie.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2 bg-slate-50/60 p-3 sm:grid-cols-3 sm:gap-2.5 sm:p-4 lg:grid-cols-4 dark:bg-neutral-950">
                    {categories.map((category) => {
                        const soldPercentage =
                            category.total > 0
                                ? Math.min(
                                      100,
                                      Math.max(
                                          0,
                                          (category.sold / category.total) *
                                              100,
                                      ),
                                  )
                                : 0;

                        return (
                            <div
                                key={category.id}
                                className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <div className="mb-2 flex items-center justify-between gap-1.5">
                                    <h3 className="truncate text-xs font-bold text-slate-800 dark:text-neutral-100">
                                        {category.name}
                                    </h3>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                                        {category.unit}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <div>
                                        <p className="text-[9px] text-slate-500 dark:text-neutral-400">
                                            Total
                                        </p>
                                        <p className="text-[11px] font-bold text-slate-800 tabular-nums dark:text-neutral-100">
                                            {formatNumber(category.total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 dark:text-neutral-400">
                                            Vendu
                                        </p>
                                        <p className="text-[11px] font-bold text-amber-700 tabular-nums dark:text-amber-300">
                                            {formatNumber(category.sold)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 dark:text-neutral-400">
                                            Reste
                                        </p>
                                        <p className="text-[11px] font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
                                            {formatNumber(category.remaining)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                                    <div
                                        className="h-full rounded-full bg-amber-500"
                                        style={{ width: `${soldPercentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {categories.length === 0 && (
                        <p className="col-span-full rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-neutral-700 dark:text-neutral-400">
                            Aucune catégorie disponible.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
