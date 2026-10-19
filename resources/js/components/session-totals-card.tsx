import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    CalendarDays,
    ShoppingBag,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SessionTotals = {
    buy: number;
    sell: number;
    margin: number;
    /** Part ouvriers (masse salariale des pointages) incluse dans le total d'achat. */
    attendance?: number;
};
export type SessionStatus = 'open' | 'closed';

export interface SessionTotalsCardProps {
    totals: SessionTotals;
    status: SessionStatus;
    className?: string;
}

type Stat = {
    label: string;
    value: string;
    icon: LucideIcon;
    cardClass: string;
    iconClass: string;
    valueClass: string;
    featured?: boolean;
    mono?: boolean;
};

function StatCard({
    label,
    value,
    icon: Icon,
    cardClass,
    iconClass,
    valueClass,
    featured = false,
    mono = true,
}: Stat) {
    return (
        <Card
            className={cn(
                'overflow-hidden py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                cardClass,
            )}
        >
            <CardContent className="flex min-h-24 items-center justify-between p-4">
                <div className="min-w-0">
                    <p
                        className={cn(
                            'text-xs font-semibold tracking-wide',
                            featured
                                ? 'text-slate-300'
                                : 'text-slate-500 dark:text-neutral-400',
                        )}
                    >
                        {label}
                    </p>
                    <p
                        className={cn(
                            'mt-2 truncate tracking-tight',
                            mono
                                ? 'font-mono text-lg font-bold sm:text-xl'
                                : 'text-lg font-bold sm:text-xl',
                            valueClass,
                        )}
                    >
                        {value}
                    </p>
                </div>
                <div
                    className={cn(
                        'ml-3 shrink-0 rounded-xl p-1.5 transition-transform group-hover:scale-110',
                        iconClass,
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}

export function SessionTotalsCard({
    totals,
    status,
    className,
}: SessionTotalsCardProps) {
    const profitable = totals.margin >= 0;
    const isOpen = status === 'open';
    const formatTotal = (value: number) => {
        return `${value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).replace(/,/g, ' ')} DH`;
    };

    const stats: Stat[] = [
        {
            label: 'Total Achats',
            value: formatTotal(totals.buy),
            icon: ShoppingCart,
            cardClass:
                'group border-slate-200/80 bg-linear-to-br from-white to-blue-50/70 dark:border-neutral-800 dark:from-neutral-900 dark:to-blue-950/20',
            iconClass:
                'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
            valueClass: 'text-blue-700 dark:text-blue-300',
        },
        {
            label: 'Total Ventes',
            value: formatTotal(Math.abs(totals.sell)),
            icon: ShoppingBag,
            cardClass:
                'group border-slate-200/80 bg-linear-to-br from-white to-orange-50/70 dark:border-neutral-800 dark:from-neutral-900 dark:to-orange-950/20',
            iconClass:
                'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
            valueClass: 'text-orange-700 dark:text-orange-300',
        },
        {
            label: 'Marge Brute',
            value: formatTotal(totals.margin),
            icon: profitable ? TrendingUp : TrendingDown,
            cardClass:
                'group border-0 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg shadow-slate-900/10 dark:from-slate-800 dark:via-neutral-900 dark:to-indigo-950',
            iconClass: 'bg-white/10 text-emerald-300',
            valueClass: profitable ? 'text-emerald-300' : 'text-rose-300',
            featured: true,
        },
        {
            label: 'Statut Session',
            value: isOpen ? 'En cours' : 'Clôturée',
            icon: CalendarDays,
            cardClass:
                'group border-slate-200/80 bg-linear-to-br from-white to-slate-50 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950',
            iconClass: isOpen
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300',
            valueClass: 'text-slate-800 dark:text-neutral-100',
            mono: false,
        },
    ];

    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
                className,
            )}
        >
            {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
            ))}
        </div>
    );
}

export default SessionTotalsCard;
