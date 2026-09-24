import { router } from '@inertiajs/react';
import { Lock, Plus } from 'lucide-react';

import AddAttendanceDialog from '@/components/add-attendance-dialog';
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
import type { SessionStatus } from '@/types/daily-session';
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
}

export function SessionAttendancesTable({
    attendances,
    formatCurrency,
    emptyMessage,
    attendanceContext,
    title = 'Feuilles de pointage',
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

                                <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(attendance.total_wage || 0)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <SessionEmptyRow colSpan={4}>
                            {emptyMessage}
                        </SessionEmptyRow>
                    )}
                </TableBody>
            </Table>
        </SessionTableShell>
    );
}

export default SessionAttendancesTable;
