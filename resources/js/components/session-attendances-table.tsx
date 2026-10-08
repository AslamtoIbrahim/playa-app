import { router } from '@inertiajs/react';
import { Lock, Plus, Trash2 } from 'lucide-react';

import AddAttendanceDialog from '@/components/add-attendance-dialog';
import DeleteAttendanceDialog from '@/components/delete-attendance-dialog';
import SaleWorkersDialog from '@/components/sale-workers-dialog';
import { Button } from '@/components/ui/button';
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
                        <span className="text-xs font-bold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                            {title} ({attendances.length})
                        </span>

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
                                    <Button size="sm" className="font-bold">
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
            <Table>
                <TableHeader className={sessionTableHeaderClass}>
                    <TableRow>
                        <TableHead>ID pointage</TableHead>
                        <TableHead>Zone</TableHead>

                        <TableHead className="text-right">
                            Total ouvriers
                        </TableHead>

                        <TableHead className="text-right">
                            Masse salariale
                        </TableHead>

                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {attendances.length > 0 ? (
                        attendances.map((attendance) => (
                            <TableRow
                                key={attendance.id}
                                className="cursor-pointer"
                                onClick={() => handleRowClick(attendance.id)}
                            >
                                <TableCell className="font-medium">
                                    #{attendance.id}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {attendance.session_zone?.zone?.name || '—'}
                                </TableCell>

                                <TableCell className="text-right font-mono">
                                    {attendance.items?.length || 0}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold text-slate-900 dark:text-neutral-100">
                                    {formatCurrency(attendance.total_wage || 0)}
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
                                            <SaleWorkersDialog
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
                        <SessionEmptyRow colSpan={5}>
                            {emptyMessage}
                        </SessionEmptyRow>
                    )}
                </TableBody>
            </Table>
        </SessionTableShell>
    );
}

export default SessionAttendancesTable;
