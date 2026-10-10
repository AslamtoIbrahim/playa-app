import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    PackageCheck,
    ShoppingCart,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';

import TrendChart from '@/components/charts/trend-chart';
import HelpPopup from '@/components/help-popup';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { show as showInvoice } from '@/routes/invoices';
import { show as showSale } from '@/routes/sales';
import type { DashboardProps } from '@/types/dashboard';

const currency = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    hint?: string;
    accent: 'amber' | 'sky' | 'emerald' | 'slate';
    delta?: number;
}

const accentStyles: Record<StatCardProps['accent'], string> = {
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
    emerald:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300',
};

function StatCard({ title, value, icon, hint, accent, delta }: StatCardProps) {
    return (
        <Card className="gap-4 border-slate-200 py-5 shadow-sm dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-5">
                <CardDescription className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-neutral-400">
                    {title}
                </CardDescription>
                <span
                    className={cn(
                        'flex size-9 items-center justify-center rounded-lg',
                        accentStyles[accent],
                    )}
                >
                    {icon}
                </span>
            </CardHeader>
            <CardContent className="px-5">
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {value}
                </div>
                {hint !== undefined && (
                    <p className="mt-1 text-xs font-medium text-muted-foreground dark:text-neutral-400">
                        {hint}
                    </p>
                )}
                {delta !== undefined && (
                    <div
                        className={cn(
                            'mt-1 flex items-center gap-1 text-xs font-bold',
                            delta >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400',
                        )}
                    >
                        {delta >= 0 ? (
                            <ArrowUpRight className="size-3.5" />
                        ) : (
                            <ArrowDownRight className="size-3.5" />
                        )}
                        {compact.format(Math.abs(delta))} MAD
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
    return (
        <TableRow>
            <TableCell
                colSpan={colSpan}
                className="py-12 text-center text-sm font-medium text-muted-foreground italic dark:text-neutral-400"
            >
                {message}
            </TableCell>
        </TableRow>
    );
}

export default function Dashboard({
    stats,
    trend,
    recentPurchases,
    recentSales,
}: DashboardProps) {
    const previous = trend.length > 1 ? trend[trend.length - 2] : null;
    const current = trend.length > 0 ? trend[trend.length - 1] : null;

    const marginDelta =
        current && previous ? current.margin - previous.margin : undefined;

    const hasData = stats.purchaseCount > 0 || stats.saleCount > 0;

    if (trend.length === 0 && !hasData) {
        return (
            <>
                <Head title="Tableau de bord" />
                <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                    <div className="flex items-center justify-between px-2">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-slate-100">
                            Tableau de bord
                        </h1>
                        <HelpPopup />
                    </div>
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                        <AlertTriangle className="text-amber-600 dark:text-amber-400" />
                        <AlertTitle className="text-amber-800 dark:text-amber-200">
                            Aucune donnée disponible
                        </AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                            Commencez par créer une journée puis vos achats et
                            ventes : les statistiques apparaîtront ici
                            automatiquement.
                        </AlertDescription>
                    </Alert>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Tableau de bord" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase dark:text-slate-100">
                            Tableau de bord
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Aperçu des achats, des ventes et de l&apos;activité
                            récente.
                        </p>
                    </div>
                    <HelpPopup />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Achats (14j)"
                        value={currency.format(stats.totalBuy)}
                        hint={`${stats.purchaseCount} facture${stats.purchaseCount > 1 ? 's' : ''} sur la période`}
                        icon={<ShoppingCart className="size-4" />}
                        accent="amber"
                    />
                    <StatCard
                        title="Ventes (14j)"
                        value={currency.format(stats.totalSell)}
                        hint={`${stats.saleCount} vente${stats.saleCount > 1 ? 's' : ''} sur la période`}
                        icon={<Wallet className="size-4" />}
                        accent="sky"
                    />
                    <StatCard
                        title="Marge (14j)"
                        value={currency.format(stats.totalMargin)}
                        icon={<TrendingUp className="size-4" />}
                        accent={stats.totalMargin >= 0 ? 'emerald' : 'slate'}
                        delta={marginDelta}
                    />
                    <StatCard
                        title="Journées (14j)"
                        value={String(stats.sessionCount)}
                        hint={`${stats.openSessionCount} ouverte${stats.openSessionCount > 1 ? 's' : ''}`}
                        icon={<PackageCheck className="size-4" />}
                        accent="slate"
                    />
                </div>

                <Card className="border-slate-200 shadow-sm dark:border-neutral-800">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Évolution sur 14 jours
                            </CardTitle>
                            <CardDescription className="dark:text-neutral-400">
                                Totaux journaliers des achats et des ventes.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-neutral-300">
                            <span className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-sm bg-amber-500 dark:bg-amber-400" />
                                Achats
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-sm bg-sky-500 dark:bg-sky-400" />
                                Ventes
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                Marge
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        <TrendChart data={trend} />
                    </CardContent>
                </Card>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                    <ShoppingCart className="size-4 text-amber-500 dark:text-amber-400" />
                                    Achats récents
                                </CardTitle>
                                <CardDescription className="dark:text-neutral-400">
                                    Dernières factures d&apos;achat.
                                </CardDescription>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-700"
                            >
                                <Link href="/invoices">Voir tout</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="px-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-neutral-800/50">
                                    <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent dark:border-neutral-700">
                                        <TableHead className="pl-6 font-bold text-slate-800 dark:text-slate-200">
                                            N°
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                            Date
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                            Fournisseur
                                        </TableHead>
                                        <TableHead className="pr-6 text-right font-bold text-slate-800 dark:text-slate-200">
                                            Montant
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentPurchases.length > 0 ? (
                                        recentPurchases.map((purchase) => (
                                            <TableRow
                                                key={purchase.id}
                                                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                                            >
                                                <TableCell className="pl-6">
                                                    <Button
                                                        asChild
                                                        variant="link"
                                                        className="h-auto p-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100"
                                                    >
                                                        <Link
                                                            href={showInvoice(
                                                                purchase.id,
                                                            )}
                                                        >
                                                            #
                                                            {
                                                                purchase.invoice_number
                                                            }
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                    {formatDateDisplay(
                                                        purchase.date,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {purchase.owner ??
                                                        'Fournisseur divers'}
                                                </TableCell>
                                                <TableCell className="pr-6 text-right font-black text-slate-900 dark:text-slate-100">
                                                    {currency.format(
                                                        purchase.amount,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <EmptyRow
                                            colSpan={4}
                                            message="Aucun achat enregistré pour le moment."
                                        />
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                    <Wallet className="size-4 text-sky-500 dark:text-sky-400" />
                                    Ventes récentes
                                </CardTitle>
                                <CardDescription className="dark:text-neutral-400">
                                    Dernières opérations de vente.
                                </CardDescription>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-700"
                            >
                                <Link href="/sales">Voir tout</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="px-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-neutral-800/50">
                                    <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent dark:border-neutral-700">
                                        <TableHead className="pl-6 font-bold text-slate-800 dark:text-slate-200">
                                            ID
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                            Date
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                            Client
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">
                                            Type
                                        </TableHead>
                                        <TableHead className="pr-6 text-right font-bold text-slate-800 dark:text-slate-200">
                                            Montant
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentSales.length > 0 ? (
                                        recentSales.map((sale) => (
                                            <TableRow
                                                key={sale.id}
                                                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                                            >
                                                <TableCell className="pl-6">
                                                    <Button
                                                        asChild
                                                        variant="link"
                                                        className="h-auto p-0 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100"
                                                    >
                                                        <Link
                                                            href={showSale(
                                                                sale.id,
                                                            )}
                                                        >
                                                            #{sale.id}
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                    {formatDateDisplay(
                                                        sale.date,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {sale.customer ??
                                                        'Client divers'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            'px-2 py-0 text-[10px] font-bold uppercase',
                                                            sale.type === 'usine'
                                                                ? 'border border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                                                                : 'border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300',
                                                        )}
                                                    >
                                                        {sale.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-6 text-right font-black text-slate-900 dark:text-slate-100">
                                                    {currency.format(sale.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <EmptyRow
                                            colSpan={5}
                                            message="Aucune vente enregistrée pour le moment."
                                        />
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Tableau de bord',
            href: dashboard(),
        },
    ],
};

