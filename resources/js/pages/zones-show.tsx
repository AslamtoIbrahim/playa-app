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
import {
    ZoneSessionColumnFilter,
    ZoneSessionFilterSummary,
    ZoneSessionSearch,
} from '@/components/zone-session-filters';
import { useZoneSessionFilters } from '@/hooks/use-zone-session-filters';
import type { ZoneDailySession } from '@/hooks/use-zone-session-filters';
import { formatDateDisplay } from '@/lib/date';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Lock, MapPin, Unlock } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
    zone: { id: number; name: string };
    dailySessions: ZoneDailySession[];
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
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const {
        filters,
        setFilters,
        filteredSessions,
        activeFilterCount,
        clearColumnFilters,
    } = useZoneSessionFilters(dailySessions);

    const toggleColumnFilters = () => {
        if (showColumnFilters) {
            clearColumnFilters();
            setShowColumnFilters(false);

            return;
        }

        setShowColumnFilters(true);
    };

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
                    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <ZoneSessionSearch
                            value={filters.search}
                            onChange={(search) =>
                                setFilters((current) => ({
                                    ...current,
                                    search,
                                }))
                            }
                            showColumnFilters={showColumnFilters}
                            activeFilterCount={activeFilterCount}
                            onToggleColumnFilters={toggleColumnFilters}
                        />
                    </div>
                    <Table>
                        <TableHeader
                            className={`bg-neutral-50/50 dark:bg-neutral-800/50 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                        >
                            <ZoneSessionFilterSummary
                                sessions={filteredSessions}
                                totalSessions={dailySessions.length}
                            />
                            <TableRow className="border-b border-neutral-200 dark:border-neutral-800">
                                <TableHead className="font-bold">
                                    <span className="inline-flex items-center">
                                        Date de journée
                                        <ZoneSessionColumnFilter
                                            column="session_date"
                                            title="Date de journée"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold">
                                    <span className="inline-flex items-center">
                                        Statut
                                        <ZoneSessionColumnFilter
                                            column="status"
                                            title="Statut"
                                            options={[
                                                {
                                                    label: 'Ouverte',
                                                    value: 'open',
                                                },
                                                {
                                                    label: 'Clôturée',
                                                    value: 'closed',
                                                },
                                            ]}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-right font-bold">
                                    <span className="inline-flex items-center">
                                        Total achat
                                        <ZoneSessionColumnFilter
                                            column="total_buy"
                                            title="Total achat"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-right font-bold">
                                    <span className="inline-flex items-center">
                                        Total vente
                                        <ZoneSessionColumnFilter
                                            column="total_sell"
                                            title="Total vente"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-right font-bold">
                                    <span className="inline-flex items-center">
                                        Marge
                                        <ZoneSessionColumnFilter
                                            column="margin"
                                            title="Marge"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSessions.length > 0 ? (
                                filteredSessions.map((session) => {
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
                                        colSpan={6}
                                        className="py-24 text-center text-muted-foreground"
                                    >
                                        Aucune journée trouvée pour cette zone.
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

ZoneShow.layout = (page: ReactNode) => ({
    breadcrumbs: [
        { title: 'Zones', href: '/zones' },
        { title: 'Journées', href: '/zones' },
    ],
    children: page,
});
