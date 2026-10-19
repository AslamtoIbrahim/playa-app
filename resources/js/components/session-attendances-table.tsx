import { router } from '@inertiajs/react';
import {
    ClipboardList,
    CircleCheck,
    Hourglass,
    Lock,
    Plus,
    Trash2,
} from 'lucide-react';

import AddAttendanceDialog from '@/components/add-attendance-dialog';
import DeleteAttendanceDialog from '@/components/delete-attendance-dialog';
import SellWorkersDialog from '@/components/sell-workers-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { computeAttendanceRemainingAmount } from '@/lib/sales';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { show as showAttendance } from '@/routes/attendances';
import type { Attendance } from '@/types/attendance';
import type { Customer } from '@/types/customer';
import type { DailySession, SessionStatus } from '@/types/daily-session';
import type { Sale } from '@/types/sale';
import type { SessionZone } from '@/types/session-zone';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

/**
 * Contexte de la journée courante : il alimente le dialogue de création et
 * l'ouverture des feuilles de pointage.
 * La journée, la zone et la date étant déjà connues, il ne reste rien à saisir :
 * la feuille créée s'ouvre directement pour pointer les ouvriers.
 */
export interface SessionAttendanceAddContext {
    sessionId: number;
    sessionDate: string;
    sessionStatus: SessionStatus;
    sessionZones: SessionZone[];
}

export type SessionAttendanceAddContextInput = SessionAttendanceAddContext;

export interface SessionAttendancesTableProps {
    attendances: Attendance[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
    /**
     * Quand fourni : affiche la barre d'outils (bouton de création) et ouvre la
     * feuille de pointage au clic sur une ligne.
     */
    attendanceContext?: SessionAttendanceAddContext | null;
    title?: string;
    /** Ventes de la journée : cibles pour imputer une part du pointage. */
    sales?: Sale[];
    /** Session courante pour créer la vente manquante depuis le dialogue. */
    session?: DailySession | null;
    /** Clients disponibles pour la nouvelle vente. */
    customers?: Customer[];
}

export function SessionAttendancesTable({
    attendances,
    formatCurrency,
    emptyMessage,
    attendanceContext,
    title = 'Feuilles de pointage',
    sales = [],
    session = null,
    customers = [],
}: SessionAttendancesTableProps) {
    const canAddAttendance = attendanceContext?.sessionStatus === 'open';

    // Ouvrir la feuille : c'est là que les ouvriers sont pointés.
    const handleRowClick = (attendanceId: number): void => {
        router.visit(
            showAttendance.url(
                attendanceId,
                attendanceContext
                    ? { query: { from_session: attendanceContext.sessionId } }
                    : undefined,
            ),
        );
    };

    return (
        <SessionTableShell
            header={
                attendanceContext ? (
                    <>
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                                <ClipboardList className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-neutral-100">
                                    {title}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-neutral-400">
                                    {attendances.length} feuille
                                    {attendances.length > 1 ? 's' : ''}{' '}
                                    enregistrée
                                    {attendances.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {canAddAttendance ? (
                            <AddAttendanceDialog
                                sessionZones={attendanceContext.sessionZones}
                                lockedSessionZoneIds={attendanceContext.sessionZones.map(
                                    (sessionZone) => sessionZone.id,
                                )}
                                lockedDate={attendanceContext.sessionDate}
                                redirectTo="show"
                                title="Nouvelle Feuille de Pointage"
                                description="La journée et la zone sont déjà définies : la feuille s'ouvre directement pour pointer les ouvriers."
                                trigger={
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Ouvrir
                                        une Feuille
                                    </Button>
                                }
                            />
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="font-bold dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                            >
                                <Lock className="mr-2 h-4 w-4" /> Journée
                                clôturée
                            </Button>
                        )}
                    </>
                ) : null
            }
        >
            <div className="overflow-x-auto">
                <Table className="min-w-[780px]">
                    <TableHeader
                        className={`${sessionTableHeaderClass} [&_th]:h-12 [&_th]:bg-slate-50/80 [&_th]:text-[10px] [&_th]:tracking-[0.12em] dark:[&_th]:bg-neutral-950/70`}
                    >
                        <TableRow>
                            <TableHead>ID pointage</TableHead>
                            <TableHead>Zone</TableHead>

                            <TableHead className="text-right">
                                Total ouvriers
                            </TableHead>

                            <TableHead className="text-right">
                                Masse salariale
                            </TableHead>

                            <TableHead className="text-right">Reste</TableHead>

                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {attendances.length > 0 ? (
                            attendances.map((attendance) => (
                                <TableRow
                                    key={attendance.id}
                                    className="group cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-50/50 dark:border-neutral-800/70 dark:hover:bg-blue-950/20"
                                    onClick={() =>
                                        handleRowClick(attendance.id)
                                    }
                                >
                                    <TableCell className="py-4">
                                        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-neutral-200">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 group-hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/50 dark:group-hover:bg-blue-900/50">
                                                <ClipboardList className="h-4 w-4" />
                                            </span>
                                            #{attendance.id}
                                        </span>
                                    </TableCell>

                                    <TableCell className="font-semibold text-slate-800 dark:text-neutral-200">
                                        {attendance.session_zone?.zone?.name ||
                                            '—'}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <span className="inline-flex min-w-9 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 tabular-nums dark:bg-neutral-800 dark:text-neutral-300">
                                            {attendance.items?.length || 0}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right font-mono text-sm font-bold text-slate-900 tabular-nums dark:text-neutral-100">
                                        {formatCurrency(
                                            attendance.total_wage || 0,
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        {(() => {
                                            const rest =
                                                computeAttendanceRemainingAmount(
                                                    attendance,
                                                );
                                            const clampedRest = Math.max(
                                                rest,
                                                0,
                                            );
                                            const isCompleted =
                                                clampedRest <= 0.005;

                                            return (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums',
                                                        isCompleted
                                                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400'
                                                            : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400',
                                                    )}
                                                >
                                                    {isCompleted ? (
                                                        <CircleCheck className="h-3 w-3" />
                                                    ) : (
                                                        <Hourglass className="h-3 w-3" />
                                                    )}

                                                    {isCompleted
                                                        ? 'Terminée'
                                                        : formatCurrency(
                                                              clampedRest,
                                                          )}
                                                </Badge>
                                            );
                                        })()}
                                    </TableCell>

                                    <TableCell
                                        className="text-right"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                    >
                                        {attendanceContext?.sessionStatus ===
                                        'open' ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <SellWorkersDialog
                                                    attendance={attendance}
                                                    sales={sales}
                                                    session={session}
                                                    customers={customers}
                                                />

                                                <DeleteAttendanceDialog
                                                    attendanceId={attendance.id}
                                                    date={attendance.date}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/70"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <SessionEmptyRow colSpan={6}>
                                {emptyMessage}
                            </SessionEmptyRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </SessionTableShell>
    );
}

export default SessionAttendancesTable;
