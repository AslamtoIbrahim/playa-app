import { Head, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Users } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';

// Types
import type { AttendancesIndexProps } from '@/types/attendance';

export default function Attendances({ attendances }: AttendancesIndexProps) {
    const handleRowClick = (attendanceId: number) => {
        router.visit(`/attendances/${attendanceId}`);
    };

    return (
        <>
            <Head title="Pointage des Ouvriers" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="px-2">
                    <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                        Pointage Quotidien
                    </h1>

                    <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                        Gestion d&apos;assiduité et calcul des salaires
                        journaliers.
                    </p>
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Date du Pointage
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Journée
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Zone
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    Masse Salariale
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendances.data.length > 0 ? (
                                attendances.data.map((attendance) => (
                                    <TableRow
                                        key={attendance.id}
                                        className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        onClick={() =>
                                            handleRowClick(attendance.id)
                                        }
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                            #{attendance.id}
                                        </TableCell>

                                        <TableCell className="font-medium text-slate-900 dark:text-neutral-100">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {attendance.date
                                                    ? formatDateDisplay(
                                                          attendance.date,
                                                      )
                                                    : '---'}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            {attendance.session_zone
                                                ?.daily_session?.session_date
                                                ? formatDateDisplay(
                                                      attendance.session_zone
                                                          .daily_session
                                                          .session_date,
                                                  )
                                                : '-'}
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            {attendance.session_zone?.zone
                                                ?.name || '-'}
                                        </TableCell>

                                        <TableCell className="text-right font-mono text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                            {new Intl.NumberFormat('fr-FR', {
                                                style: 'currency',
                                                currency: 'MAD',
                                            }).format(
                                                Number(attendance.total_wage),
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucune feuille de pointage enregistrée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <Users className="h-4 w-4" />
                            {attendances.meta?.total ||
                                attendances.data.length}{' '}
                            Feuilles au total
                        </div>

                        <div className="flex gap-2">
                            {attendances.links?.map((link, i) => {
                                const isPrevious =
                                    link.label.includes('Previous');
                                const isNext = link.label.includes('Next');

                                if (!link.url && !link.active) {
                                    return null;
                                }

                                return (
                                    <Button
                                        key={i}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        className={cn(
                                            'h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
                                            !link.url &&
                                                'pointer-events-none cursor-not-allowed opacity-40',
                                            link.active &&
                                                'scale-105 shadow-md dark:bg-primary dark:text-primary-foreground',
                                        )}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <a href={link.url}>
                                                {isPrevious ? (
                                                    <ChevronLeft className="h-4 w-4" />
                                                ) : isNext ? (
                                                    <ChevronRight className="h-4 w-4" />
                                                ) : (
                                                    link.label
                                                )}
                                            </a>
                                        ) : (
                                            <span>
                                                {isPrevious ? (
                                                    <ChevronLeft className="h-4 w-4" />
                                                ) : isNext ? (
                                                    <ChevronRight className="h-4 w-4" />
                                                ) : (
                                                    link.label
                                                )}
                                            </span>
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Attendances.layout = {
    breadcrumbs: [
        {
            title: 'Pointages',
            href: '/attendances',
        },
    ],
};
