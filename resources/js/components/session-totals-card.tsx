import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { cn, currency } from '@/lib/utils';
import {
    CalendarDays,
    ShoppingBag,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SessionTotals = { buy: number; sell: number; margin: number };
export type SessionStatus = 'open' | 'closed';

export interface SessionTotalsCardProps {
    totals: SessionTotals;
    status: SessionStatus;
    formatCurrency?: (value: number) => string;
    className?: string;
}

// const currency = (value: number) =>
//     new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value);

type Stat = {
    label: string;
    value: string;
    icon: LucideIcon;
    iconClass: string;
    valueClass?: string;
    mono?: boolean;
};

function StatCard({ label, value, icon: Icon, iconClass, valueClass, mono = true }: Stat) {
    return (
        <Card className="border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                    {label}
                </CardDescription>
                <Icon className={cn('h-4 w-4', iconClass)} />
            </CardHeader>
            <CardContent>
                <div
                    className={cn(
                        mono ? 'font-mono text-2xl font-black' : 'text-lg font-bold',
                        valueClass ?? 'text-neutral-900 dark:text-neutral-100',
                    )}
                >
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}

export function SessionTotalsCard({
    totals,
    status,
    formatCurrency = currency,
    className,
}: SessionTotalsCardProps) {
    const up = totals.margin >= 0;

    const stats: Stat[] = [
        {
            label: 'Total Achats',
            value: formatCurrency(totals.buy),
            icon: ShoppingCart,
            iconClass: 'text-blue-500',
            valueClass: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Total Ventes',
            value: formatCurrency(totals.sell),
            icon: ShoppingBag,
            iconClass: 'text-orange-500',
            valueClass: 'text-orange-600 dark:text-orange-400',
        },
        {
            label: 'Marge Brute',
            value: formatCurrency(totals.margin),
            icon: up ? TrendingUp : TrendingDown,
            iconClass: up ? 'text-green-500' : 'text-red-500',
            valueClass: up
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400',
        },
        {
            label: 'Statut Session',
            value: status === 'open' ? 'En cours' : 'Clôturée',
            icon: CalendarDays,
            iconClass: 'text-neutral-500',
            valueClass: 'text-neutral-800 dark:text-neutral-200',
            mono: false,
        },
    ];

    return (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
            {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
            ))}
        </div>
    );
}

export default SessionTotalsCard;