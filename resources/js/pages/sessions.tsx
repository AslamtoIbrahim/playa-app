import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { SessionsIndexProps } from '@/types/daily-session';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Lock,
    Unlock,
} from 'lucide-react';
import type { ReactNode } from 'react';

export default function Sessions({ sessions }: SessionsIndexProps) {
    const calculateMargin = (sell: number, buy: number) => {
        return sell - buy;
    };

    const handleRowClick = (sessionId: number) => {
        router.visit(`/sessions/${sessionId}`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD',
        }).format(amount);
    };

    return (
        <>
            <Head title="Sessions Journalières" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="px-2">
                    <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                        Sessions Journalières
                    </h1>

                    <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                        Gestion des sessions de vente et d&apos;achat de la
                        journée.
                    </p>
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Date de Journée
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Status
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    Total Achat
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    Total Vente
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    Marge
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sessions.data.length > 0 ? (
                                sessions.data.map((session) => {
                                    const margin = calculateMargin(
                                        session.total_sell,
                                        session.total_buy,
                                    );

                                    return (
                                        <TableRow
                                            key={session.id}
                                            className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                            onClick={() => {
                                                handleRowClick(session.id);
                                            }}
                                        >
                                            <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                                #{session.id}
                                            </TableCell>

                                            <TableCell className="font-medium text-slate-900 dark:text-neutral-100">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {formatDateDisplay(
                                                        session.session_date,
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {session.status === 'open' ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                    >
                                                        <Unlock className="h-3 w-3" />{' '}
                                                        Ouverte
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="secondary"
                                                        className="gap-1 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                                    >
                                                        <Lock className="h-3 w-3" />{' '}
                                                        Clôturée
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right font-mono text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                {formatCurrency(
                                                    session.total_buy,
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(
                                                    session.total_sell,
                                                )}
                                            </TableCell>

                                            <TableCell
                                                className={`text-right font-mono text-sm font-bold ${
                                                    margin >= 0
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                }`}
                                            >
                                                {formatCurrency(margin)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucune session trouvée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <CalendarDays className="h-4 w-4" />
                            {sessions.total} Session
                            {sessions.total > 1 ? 's' : ''} au total
                        </div>

                        <div className="flex gap-2">
                            {sessions.links.map((link, i) => {
                                const isPrevious =
                                    link.label.includes('Previous');
                                const isNext = link.label.includes('Next');

                                if (!link.url && !link.active) {
                                    return null;
                                }

                                return (
                                    <Button
                                        key={i}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        className={cn(
                                            'h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
                                            !link.url &&
                                                'pointer-events-none cursor-not-allowed opacity-40',
                                            link.active &&
                                                'scale-105 shadow-md dark:bg-primary dark:text-primary-foreground',
                                        )}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <a href={link.url}>
                                                {isPrevious ? (
                                                    <ChevronLeft className="h-4 w-4" />
                                                ) : isNext ? (
                                                    <ChevronRight className="h-4 w-4" />
                                                ) : (
                                                    link.label
                                                )}
                                            </a>
                                        ) : (
                                            <span>
                                                {isPrevious ? (
                                                    <ChevronLeft className="h-4 w-4" />
                                                ) : isNext ? (
                                                    <ChevronRight className="h-4 w-4" />
                                                ) : (
                                                    link.label
                                                )}
                                            </span>
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Sessions.layout = (page: ReactNode) => {
    return {
        breadcrumbs: [
            {
                title: 'Journées',
                href: '/sessions',
            },
        ],
        children: page,
    };
};
