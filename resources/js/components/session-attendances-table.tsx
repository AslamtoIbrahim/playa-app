import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Attendance } from '@/types/attendance';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

export interface SessionAttendancesTableProps {
    attendances: Attendance[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}

export function SessionAttendancesTable({
    attendances,
    formatCurrency,
    emptyMessage,
}: SessionAttendancesTableProps) {
    return (
        <SessionTableShell>
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
                            <TableRow key={attendance.id}>
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
