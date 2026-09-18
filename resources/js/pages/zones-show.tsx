import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AddSessionForZoneDialog from '@/components/add-session-for-zone-dialog';
import EditSessionForZoneDialog from '@/components/edit-session-for-zone-dialog';
import { formatDateDisplay } from '@/lib/date';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Lock, MapPin, Unlock } from 'lucide-react';

interface Zone {
    id: number;
    name: string;
}

interface DailySession {
    id: number | null;
    session_date: string | null;
    status: string | null;
    total_buy: number;
    total_sell: number;
    closed_at: string | null;
}

interface Props {
    zone: Zone;
    dailySessions: DailySession[];
    existingSessionDates: string[];
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'MAD',
    }).format(amount);

export default function ZoneShow({
    zone,
    dailySessions,
    existingSessionDates,
}: Props) {
    return (
        <>
            <Head title={`Zone ${zone.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <Link
                            href="/zones"
                            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" /> Retour aux zones
                        </Link>
                        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            <MapPin className="h-6 w-6" /> {zone.name}
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Sessions associées à cette zone.
                        </p>
                    </div>
                    <AddSessionForZoneDialog
                        zone={zone}
                        existingSessionDates={existingSessionDates}
                    />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 dark:border-neutral-800">
                                <TableHead className="font-bold">
                                    Date de journée
                                </TableHead>
                                <TableHead className="font-bold">
                                    Statut
                                </TableHead>
                                <TableHead className="text-right font-bold">
                                    Total achat
                                </TableHead>
                                <TableHead className="text-right font-bold">
                                    Total vente
                                </TableHead>
                                <TableHead className="text-right font-bold">
                                    Marge
                                </TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailySessions.length > 0 ? (
                                dailySessions.map((session) => {
                                    const margin =
                                        session.total_sell - session.total_buy;

                                    return (
                                        <TableRow
                                            key={
                                                session.id ??
                                                session.session_date
                                            }
                                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800/70"
                                            onClick={() => {
                                                if (session.id) {
                                                    router.visit(
                                                        `/sessions/${session.id}`,
                                                    );
                                                }
                                            }}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-slate-400" />
                                                    {session.session_date
                                                        ? formatDateDisplay(
                                                              session.session_date,
                                                          )
                                                        : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1 text-sm">
                                                    {session.status ===
                                                    'open' ? (
                                                        <Unlock className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Lock className="h-4 w-4 text-neutral-500" />
                                                    )}
                                                    {session.status === 'open'
                                                        ? 'Ouverte'
                                                        : 'Clôturée'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(
                                                    session.total_buy,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-blue-600">
                                                {formatCurrency(
                                                    session.total_sell,
                                                )}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-mono font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {formatCurrency(margin)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {session.id && (
                                                    <EditSessionForZoneDialog
                                                        zone={zone}
                                                        session={{
                                                            id: session.id,
                                                            session_date:
                                                                session.session_date,
                                                        }}
                                                        existingSessionDates={
                                                            existingSessionDates
                                                        }
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-24 text-center text-muted-foreground"
                                    >
                                        Aucune session trouvée pour cette zone.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

ZoneShow.layout = (page: React.ReactNode) => ({
    breadcrumbs: [
        { title: 'Zones', href: '/zones' },
        { title: 'Journées', href: '/zones' },
    ],
    children: page,
});
