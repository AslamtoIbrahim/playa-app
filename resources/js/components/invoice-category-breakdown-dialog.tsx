import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { Stats } from '@/types/stats';

function formatQuantity(value: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
        .format(value)
        .replaceAll(',', ' ');
}

const categoryBadgeColors = [
    'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
    'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
    'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200',
    'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200',
    'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200',
    'border-lime-300 bg-lime-50 text-lime-800 dark:border-lime-800 dark:bg-lime-950/50 dark:text-lime-200',
];

const categoryProgressColors = [
    'bg-sky-500',
    'bg-violet-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-indigo-500',
    'bg-lime-500',
];

const priorityCategoryNames = ['poulpe', 'calamar', 'seiche'];

interface Props {
    categories: Stats['categoryBreakdown'];
    availableStockByCategory: Record<number, number>;
}

const remainingCountFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
});

export function InvoiceCategoryBreakdownDialog({
    categories,
    availableStockByCategory,
}: Props) {
    const [open, setOpen] = useState(false);
    const [animateProgress, setAnimateProgress] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        const animationFrame = requestAnimationFrame(() => {
            setAnimateProgress(true);
        });

        return () => cancelAnimationFrame(animationFrame);
    }, [open]);

    const previewCategories = [...categories]
        .sort((first, second) => {
            const firstPriority = priorityCategoryNames.findIndex((name) =>
                first.name.toLocaleLowerCase().includes(name),
            );
            const secondPriority = priorityCategoryNames.findIndex((name) =>
                second.name.toLocaleLowerCase().includes(name),
            );
            const firstRank = firstPriority === -1 ? priorityCategoryNames.length : firstPriority;
            const secondRank = secondPriority === -1 ? priorityCategoryNames.length : secondPriority;

            return firstRank - secondRank;
        })
        .slice(0, 6);
    const sortedCategories = [...categories].sort((first, second) => {
        const firstPriority = priorityCategoryNames.findIndex((name) =>
            first.name.toLocaleLowerCase().includes(name),
        );
        const secondPriority = priorityCategoryNames.findIndex((name) =>
            second.name.toLocaleLowerCase().includes(name),
        );
        const firstRank =
            firstPriority === -1 ? priorityCategoryNames.length : firstPriority;
        const secondRank =
            secondPriority === -1 ? priorityCategoryNames.length : secondPriority;

        return firstRank - secondRank;
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setAnimateProgress(false);
                setOpen(nextOpen);
            }}
        >
            <DialogTrigger asChild>
                <button type="button" className="w-full cursor-pointer text-left lg:order-4">
                    <Card className="group overflow-hidden border-emerald-200/80 bg-linear-to-br from-white to-emerald-50/70 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-900 dark:from-neutral-900 dark:to-emerald-950/20">
                        <CardContent className="flex min-h-16 items-center justify-between gap-3 p-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">
                                    Catégories : {formatQuantity(categories.length)}
                                </p>
                                {categories.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {previewCategories.map((category) => {
                                            const remaining =
                                                availableStockByCategory[
                                                    category.id
                                                ] ?? category.remaining;
                                            const isOutOfStock = remaining === 0;

                                            return (
                                                <Badge
                                                    key={category.id}
                                                    variant="outline"
                                                    className={cn(
                                                        'h-6 gap-1 px-1.5 text-[10px] font-medium shadow-sm',
                                                        isOutOfStock
                                                            ? 'animate-pulse border-red-400 bg-red-50 text-red-700 motion-reduce:animate-none dark:border-red-700 dark:bg-red-950/60 dark:text-red-300'
                                                            : categoryBadgeColors[
                                                                  category.id %
                                                                      categoryBadgeColors.length
                                                              ],
                                                    )}
                                                >
                                                    <span className="max-w-24 truncate">
                                                        {category.name}:
                                                    </span>
                                                    <span className="font-bold tabular-nums">
                                                        {remainingCountFormatter.format(
                                                            remaining,
                                                        )}{' '}
                                                        {category.unit}
                                                    </span>
                                                </Badge>
                                            );
                                        })}
                                        {categories.length > previewCategories.length && (
                                            <Badge variant="outline" className="h-6 px-1.5 text-[10px] text-slate-500">
                                                +{categories.length - previewCategories.length} autres
                                            </Badge>
                                        )}
                                    </div>
                                )}
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
                    {sortedCategories.map((category) => {
                        const remaining =
                            availableStockByCategory[category.id] ??
                            category.remaining;
                        const sold = Math.max(0, category.total - remaining);
                        const isOutOfStock = remaining === 0;
                        const categoryColor = isOutOfStock
                            ? 'bg-red-500'
                            : categoryProgressColors[
                                  category.id % categoryBadgeColors.length
                              ];
                        const soldPercentage =
                            category.total > 0
                                ? Math.min(
                                      100,
                                      Math.max(
                                          0,
                                          (sold / category.total) *
                                              100,
                                      ),
                                  )
                                : 0;

                        return (
                            <div
                                key={category.id}
                                className={cn(
                                    'rounded-lg border bg-white p-2.5 shadow-sm transition-colors duration-300 dark:bg-neutral-900',
                                    isOutOfStock
                                        ? 'animate-pulse border-red-300 motion-reduce:animate-none dark:border-red-900'
                                        : 'border-slate-200 dark:border-neutral-800',
                                )}
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
                                            {formatQuantity(category.total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 dark:text-neutral-400">
                                            Vendu
                                        </p>
                                        <p className="text-[11px] font-bold text-amber-700 tabular-nums dark:text-amber-300">
                                            {remainingCountFormatter.format(sold)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 dark:text-neutral-400">
                                            Reste
                                        </p>
                                        <p
                                            className={cn(
                                                'text-[11px] font-bold tabular-nums',
                                                isOutOfStock
                                                    ? 'text-red-700 dark:text-red-300'
                                                    : 'text-emerald-700 dark:text-emerald-300',
                                            )}
                                        >
                                            {remainingCountFormatter.format(remaining)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-[width,background-color] duration-700 ease-in-out motion-reduce:transition-none',
                                            categoryColor,
                                        )}
                                        style={{
                                            width: `${animateProgress ? soldPercentage : 0}%`,
                                        }}
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
