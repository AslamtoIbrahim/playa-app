import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Pencil,
    Trash2,
} from 'lucide-react';

// Components
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
import { cn } from '@/lib/utils';

// Dialogs
import AddAttendanceDialog from '@/components/add-attendance-dialog';
import DeleteAttendanceDialog from '@/components/delete-attendance-dialog';
import EditAttendanceDialog from '@/components/edit-attendance-dialog';

// Types
import type { AttendancesIndexProps } from '@/types/attendance';

export default function Attendances({
    attendances,
    sessionZones,
}: AttendancesIndexProps) {

    const handleRowClick = (attendanceId: number) => {
        router.visit(`/attendances/${attendanceId}`);
    };

    return (
        <>
            <Head title="Pointage des Ouvriers" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                            Pointage Quotidien
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground">
                            Gestion d'assiduité et calcul des salaires
                            journaliers.
                        </p>
                    </div>

                    {/* هاد الـ Dialog دابا غايخدم مزيان حيت صيفطنا ليه الـ sessions */}
                    <AddAttendanceDialog sessionZones={sessionZones} />
                </div>

                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-b border-slate-200 text-sm hover:bg-transparent">
                                <TableHead className="w-24 font-bold text-slate-800">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-slate-800">
                                    Date du Pointage
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800">
                                    Journée
                                </TableHead>
                                <TableHead className="text-center font-bold text-slate-800">
                                    Zone
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-800">
                                    Masse Salariale
                                </TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {attendances.data.length > 0 ? (
                                attendances.data.map((attendance) => (
                                    <TableRow
                                        key={attendance.id}
                                        onClick={() =>
                                            handleRowClick(attendance.id)
                                        }
                                        className="group cursor-pointer border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700">
                                            #{attendance.id}
                                        </TableCell>

                                        {/* هنا استعملنا التاريخ اللي جا من الـ Accessor في Laravel */}
                                        <TableCell className="text-sm font-semibold text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                                {attendance.date
                                                    ? format(
                                                        new Date(
                                                            attendance.date,
                                                        ),
                                                        'dd MMMM yyyy',
                                                    )
                                                    : '---'}
                                            </div>
                                        </TableCell>

                                        {/* <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {attendance.sessionZone ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'flex items-center gap-1.5 border px-3 py-1 font-bold shadow-sm',
                                                            attendance
                                                                .sessionZone
                                                                .status ===
                                                                'open'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : 'border-slate-200 bg-slate-50 text-slate-600',
                                                        )}
                                                    >
                                                        <Clock
                                                            className={cn(
                                                                'h-3.5 w-3.5',
                                                                attendance
                                                                    .sessionZone
                                                                    .status ===
                                                                    'open'
                                                                    ? 'text-emerald-500'
                                                                    : 'text-slate-400',
                                                            )}
                                                        />
                                                        <span className="text-[11px] tracking-wider uppercase">
                                                            {attendance
                                                                .sessionZone
                                                                .session_date
                                                                ? format(
                                                                    new Date(
                                                                        attendance
                                                                            .sessionZone
                                                                            .session_date,
                                                                    ),
                                                                    'dd-MM-yyyy',
                                                                )
                                                                : '---'}
                                                        </span>
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">
                                                        Sans session
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell> */}

                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {attendance.session_zone ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'flex items-center gap-1 border px-2 py-0.5 font-bold',
                                                            attendance.session_zone.daily_session
                                                                ?.status ===
                                                                'open'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : 'border-slate-200 bg-slate-50 text-slate-600',
                                                        )}
                                                    >
                                                        <Clock
                                                            className={cn(
                                                                'h-3 w-3',
                                                                attendance
                                                                    .session_zone
                                                                    .daily_session
                                                                    ?.status ===
                                                                    'open'
                                                                    ? 'text-emerald-500'
                                                                    : 'text-slate-400',
                                                            )}
                                                        />

                                                        <span className="text-[10px] tracking-wider uppercase">
                                                            {attendance.session_zone?.daily_session?.session_date
                                                                ? format(new Date(attendance.session_zone.daily_session.session_date), 'dd/MM/yy')
                                                                : ''
                                                            }
                                                        </span>
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {attendance.session_zone ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn('flex items-center gap-1 border px-2 py-0.5 font-bold')}
                                                    >
                                                        <MapPin />

                                                        <span className="text-[10px] tracking-wider uppercase">
                                                            {
                                                                attendance.session_zone?.zone?.name
                                                            }
                                                        </span>
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="bg-slate-50/30 text-right text-base font-black text-slate-900">
                                            {new Intl.NumberFormat('fr-FR', {
                                                style: 'currency',
                                                currency: 'MAD',
                                            }).format(
                                                Number(attendance.total_wage),
                                            )}
                                        </TableCell>

                                        <TableCell
                                            className="text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <EditAttendanceDialog
                                                    attendance={attendance}
                                                    sessionZones={sessionZones}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />

                                                <DeleteAttendanceDialog
                                                    attendanceId={attendance.id}
                                                    date={attendance.date}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-24 text-center font-medium text-muted-foreground italic"
                                    >
                                        Aucune feuille de pointage enregistrée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                            {attendances.meta?.total || attendances.data.length}{' '}
                            Feuilles au total
                        </div>

                        <div className="flex gap-1">
                            {attendances.links?.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    disabled={!link.url}
                                    className={cn(
                                        'h-8 min-w-8 text-xs font-bold shadow-none transition-all',
                                        link.active &&
                                        'scale-105 bg-slate-900 text-white',
                                        !link.url && 'opacity-30',
                                    )}
                                    asChild={!!link.url}
                                >
                                    {link.url ? (
                                        <a href={link.url}>
                                            {link.label.includes('Previous') ? (
                                                <ChevronLeft className="h-4 w-4" />
                                            ) : link.label.includes('Next') ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                link.label
                                            )}
                                        </a>
                                    ) : (
                                        <span>
                                            {link.label.includes('Previous') ? (
                                                <ChevronLeft className="h-4 w-4" />
                                            ) : link.label.includes('Next') ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                link.label
                                            )}
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Attendances.layout = (page: any) => ({
    children: page,
    breadcrumbs: [{ title: 'Pointages', href: '/attendances' }],
});
