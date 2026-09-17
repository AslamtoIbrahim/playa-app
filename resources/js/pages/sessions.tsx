import AddSessionDialog from '@/components/add-session-dialog';
import CloseSessionDialog from '@/components/close-session-dialog';
import DeleteSessionDialog from '@/components/delete-session-dialog';
import EditSessionDialog from '@/components/edit-session-dialog';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import type { DailySession } from '@/types/daily-session';
import type { Zone } from '@/types/zone';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, Lock, Unlock } from 'lucide-react';

interface Props {
    sessions: DailySession[];
    zones: Zone[]; // نضفنا الـ zones هنا
    // existingDates: string[];
}

export default function Sessions({ sessions, zones }: Props) {
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
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Sessions Journalières
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion des sessions de vente et d&apos;achat de la journée.
                        </p>
                    </div>

                    <AddSessionDialog zones={zones} />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
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
                                <TableHead className="w-32 text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sessions.length > 0 ? (
                                sessions.map((session) => {
                                    const margin = calculateMargin(session.total_sell, session.total_buy);

                                    return (
                                        <TableRow
                                            key={session.id}
                                            className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                            onClick={() => {
                                                handleRowClick(session.id);
                                            }}
                                        >
                                            <TableCell className="font-medium text-slate-900 dark:text-neutral-100">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {formatDateDisplay(session.session_date)}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {session.status === 'open' ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                    >
                                                        <Unlock className="h-3 w-3" /> Ouverte
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="secondary"
                                                        className="gap-1 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                                    >
                                                        <Lock className="h-3 w-3" /> Clôturée
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right font-mono text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                {formatCurrency(session.total_buy)}
                                            </TableCell>

                                            <TableCell className="text-right font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(session.total_sell)}
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

                                            <TableCell
                                                className="text-center"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <div className="flex justify-center gap-2">
                                                    {session.status === 'open' ? (
                                                        <>
                                                            <EditSessionDialog
                                                                session={session}
                                                                zones={zones}
                                                            />

                                                            <CloseSessionDialog session={session} />

                                                            <DeleteSessionDialog
                                                                sessionId={session.id}
                                                                sessionDate={session.session_date}
                                                            />
                                                        </>
                                                    ) : (
                                                        <span className="text-xs italic text-muted-foreground">
                                                            Aucune action
                                                        </span>
                                                    )}
                                                </div>
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
                            {sessions.length} Session{sessions.length > 1 ? 's' : ''} au total
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Sessions.layout = (page: any) => {
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