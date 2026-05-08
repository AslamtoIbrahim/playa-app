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
import { Lock, Unlock } from 'lucide-react';

interface Props {
    sessions: DailySession[];
    zones: Zone[]; // نضفنا الـ zones هنا
    existingDates: string[];
}

export default function Sessions({ sessions, zones, existingDates }: Props) {
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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Sessions Journalières</h1>

                    {/* تمرير الـ zones للـ Dialog */}
                    <AddSessionDialog existingDates={existingDates} zones={zones} />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 md:min-h-min dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date de Journée</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total Achat</TableHead>
                                <TableHead className="text-right">Total Vente</TableHead>
                                <TableHead className="text-right">Marge</TableHead>
                                <TableHead className="text-center w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sessions.map((session) => {
                                const margin = calculateMargin(session.total_sell, session.total_buy);

                                return (
                                    <TableRow
                                        className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                                        key={session.id}
                                        onClick={() => {
                                            handleRowClick(session.id);
                                        }}
                                    >
                                        <TableCell className="font-medium">
                                            {formatDateDisplay(session.session_date)}
                                        </TableCell>

                                        <TableCell>
                                            {session.status === 'open' ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-green-500 text-green-600 gap-1"
                                                >
                                                    <Unlock className="h-3 w-3" /> Ouverte
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Lock className="h-3 w-3" /> Clôturée
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(session.total_buy)}
                                        </TableCell>

                                        <TableCell className="text-right font-mono text-blue-600 font-semibold">
                                            {formatCurrency(session.total_sell)}
                                        </TableCell>

                                        <TableCell
                                            className={`text-right font-mono font-bold ${
                                                margin >= 0 ? 'text-green-600' : 'text-red-600'
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
                                                        {/* تمرير الـ zones للـ Edit */}
                                                        <EditSessionDialog
                                                            session={session}
                                                            existingDates={existingDates}
                                                            zones={zones}
                                                        />

                                                        <CloseSessionDialog session={session} />

                                                        <DeleteSessionDialog
                                                            sessionId={session.id}
                                                            sessionDate={session.session_date}
                                                        />
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Aucune action
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
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