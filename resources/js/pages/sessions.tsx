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
import { Head } from '@inertiajs/react';
import { Lock, Unlock } from 'lucide-react';

interface Props {
    sessions: DailySession[];
}

export default function Sessions({ sessions }: Props) {
    // Helper باش نحسبو الربح (Margin)
    const calculateMargin = (sell: number, buy: number) => sell - buy;
    // كنخرجو غير التواريخ وكنصيفطوهم كـ Array ديال strings
    const existingDates = sessions.map(session => session.session_date);

    return (
        <>
            <Head title="Sessions Journalières" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Sessions Journalières</h1>
                    <AddSessionDialog existingDates={existingDates} />
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
                            {sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">
                                        {formatDateDisplay(session.session_date)}
                                    </TableCell>

                                    <TableCell>
                                        {session.status === 'open' ? (
                                            <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
                                                <Unlock className="h-3 w-3" /> Ouverte
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="gap-1">
                                                <Lock className="h-3 w-3" /> Clôturée
                                            </Badge>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right font-mono">
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(session.total_buy)}
                                    </TableCell>

                                    <TableCell className="text-right font-mono text-blue-600 font-semibold">
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(session.total_sell)}
                                    </TableCell>

                                    <TableCell className={`text-right font-mono font-bold ${calculateMargin(session.total_sell, session.total_buy) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(calculateMargin(session.total_sell, session.total_buy))}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            {session.status === 'open' ? (
                                                <>
                                                    <EditSessionDialog session={session} existingDates={existingDates} />
                                                    <CloseSessionDialog session={session} />
                                                    <DeleteSessionDialog sessionId={session.id} sessionDate={session.session_date} />
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Aucune action</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

Sessions.layout = {
    breadcrumbs: [
        {
            title: 'Journées',
            href: '/sessions',
        },
    ],
};