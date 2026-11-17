import { Head, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

// Components
import { AttendanceSelectionStatistics } from '@/components/attendance-selection-statistics';
import {
    AttendanceColumnFilter,
    AttendanceFilterSummary,
    AttendanceSearch,
} from '@/components/attendance-filters';
import { Button } from '@/components/ui/button';
import { useAttendanceCellSelection } from '@/hooks/use-attendance-cell-selection';
import type { AttendanceSelectionField } from '@/hooks/use-attendance-cell-selection';
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
import {
    formatAttendanceCurrency,
    getAttendanceFilterOptions,
    useAttendanceFilters,
} from '@/hooks/use-attendance-filters';

// Types
import type { AttendancesIndexProps } from '@/types/attendance';

export default function Attendances({ attendances }: AttendancesIndexProps) {
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const { filters, setFilters, filteredAttendances, activeFilterCount } =
        useAttendanceFilters(attendances.data);
    const {
        setSelection: setCellSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics: selectionStatistics,
    } = useAttendanceCellSelection(filteredAttendances);
    const cellSelectDrag = useRef<{
        rowId: number;
        field: AttendanceSelectionField;
    } | null>(null);
    const suppressRowClick = useRef(false);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const drag = cellSelectDrag.current;
            const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>(
                    '[data-attendance-cell][data-attendance-row]',
                );

            if (drag && target?.dataset.attendanceRow) {
                const rowId = Number(target.dataset.attendanceRow);

                if (
                    rowId !== drag.rowId ||
                    target.dataset.attendanceCell !== drag.field
                ) {
                    suppressRowClick.current = true;
                }

                if (target.dataset.attendanceCell === drag.field) {
                    extendSelection(rowId, drag.field);
                }
            }
        };

        const handlePointerUp = () => {
            cellSelectDrag.current = null;
        };

        const clearCellSelectionOutsideTable = (event: PointerEvent) => {
            const target = event.target;

            if (
                target instanceof Element &&
                !target.closest(
                    '[data-attendance-cell], [data-attendance-selection-statistics]',
                )
            ) {
                setCellSelection(null);
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        document.addEventListener(
            'pointerdown',
            clearCellSelectionOutsideTable,
        );

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
            document.removeEventListener(
                'pointerdown',
                clearCellSelectionOutsideTable,
            );
        };
    }, [extendSelection, setCellSelection]);

    const handleRowClick = (attendanceId: number) => {
        router.visit(`/attendances/${attendanceId}`);
    };

    const getSelectionCellProps = (
        rowId: number,
        field: AttendanceSelectionField,
    ) => {
        const selectedCell = getSelectedCellRange(rowId);
        const selected = selectedCell?.includes(`|${rowId}:${field}|`) ?? false;

        return {
            'data-attendance-cell': field,
            'data-attendance-row': rowId,
            onMouseDownCapture: (
                event: ReactMouseEvent<HTMLTableCellElement>,
            ) => {
                suppressRowClick.current = false;
                selectCell(rowId, field, event.shiftKey);
                cellSelectDrag.current = event.shiftKey
                    ? null
                    : { rowId, field };
            },
            style: {
                cursor: 'cell',
                userSelect: 'none' as const,
                ...(selected
                    ? {
                          position: 'relative' as const,
                          backgroundColor: 'rgb(59 130 246 / 12%)',
                          boxShadow: [
                              'inset 1px 0 rgb(59 130 246)',
                              'inset -1px 0 rgb(59 130 246)',
                              selectedCell?.startsWith(`|${rowId}:${field}|`)
                                  ? 'inset 0 1px rgb(59 130 246)'
                                  : '',
                              selectedCell?.endsWith(`|${rowId}:${field}|`)
                                  ? 'inset 0 -1px rgb(59 130 246)'
                                  : '',
                          ]
                              .filter(Boolean)
                              .join(', '),
                      }
                    : {}),
            },
        };
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
                    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <AttendanceSearch
                            value={filters.search}
                            onChange={(search) =>
                                setFilters((current) => ({
                                    ...current,
                                    search,
                                }))
                            }
                            showColumnFilters={showColumnFilters}
                            activeFilterCount={activeFilterCount}
                            onToggleColumnFilters={() => {
                                setFilters({ search: '', columns: {} });
                                setShowColumnFilters((current) => !current);
                            }}
                        />
                        <AttendanceSelectionStatistics
                            statistics={selectionStatistics}
                        />
                    </div>
                    <Table>
                        <TableHeader
                            className={`bg-neutral-50/50 dark:bg-neutral-800/50 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                        >
                            <AttendanceFilterSummary
                                attendances={filteredAttendances}
                                totalAttendances={attendances.data.length}
                            />
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        ID
                                        <AttendanceColumnFilter
                                            column="id"
                                            title="ID"
                                            kind="number"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Date du Pointage
                                        <AttendanceColumnFilter
                                            column="date"
                                            title="Date du Pointage"
                                            kind="date"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Journée
                                        <AttendanceColumnFilter
                                            column="session_date"
                                            title="Journée"
                                            kind="date"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Zone
                                        <AttendanceColumnFilter
                                            column="zone"
                                            title="Zone"
                                            kind="text"
                                            options={getAttendanceFilterOptions(
                                                attendances.data,
                                                'zone',
                                            )}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Masse Salariale
                                        <AttendanceColumnFilter
                                            column="total_wage"
                                            title="Masse Salariale"
                                            kind="number"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAttendances.length > 0 ? (
                                filteredAttendances.map((attendance) => (
                                    <TableRow
                                        key={attendance.id}
                                        className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        onClick={(event) => {
                                            if (
                                                event.shiftKey ||
                                                suppressRowClick.current
                                            ) {
                                                suppressRowClick.current = false;

                                                return;
                                            }

                                            handleRowClick(attendance.id);
                                        }}
                                    >
                                        <TableCell
                                            {...getSelectionCellProps(
                                                attendance.id,
                                                'id',
                                            )}
                                            className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300"
                                        >
                                            #{attendance.id}
                                        </TableCell>

                                        <TableCell
                                            {...getSelectionCellProps(
                                                attendance.id,
                                                'date',
                                            )}
                                            className="font-medium text-slate-900 dark:text-neutral-100"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {attendance.date
                                                    ? formatDateDisplay(
                                                          attendance.date,
                                                      )
                                                    : '---'}
                                            </div>
                                        </TableCell>

                                        <TableCell
                                            {...getSelectionCellProps(
                                                attendance.id,
                                                'session_date',
                                            )}
                                            className="text-sm font-medium text-slate-600 dark:text-neutral-300"
                                        >
                                            {attendance.session_zone
                                                ?.daily_session?.session_date
                                                ? formatDateDisplay(
                                                      attendance.session_zone
                                                          .daily_session
                                                          .session_date,
                                                  )
                                                : '-'}
                                        </TableCell>

                                        <TableCell
                                            {...getSelectionCellProps(
                                                attendance.id,
                                                'zone',
                                            )}
                                            className="text-sm font-medium text-slate-600 dark:text-neutral-300"
                                        >
                                            {attendance.session_zone?.zone
                                                ?.name || '-'}
                                        </TableCell>

                                        <TableCell
                                            {...getSelectionCellProps(
                                                attendance.id,
                                                'total_wage',
                                            )}
                                            className="text-right font-mono text-sm font-semibold text-slate-900 dark:text-neutral-100"
                                        >
                                            {formatAttendanceCurrency(
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
                                        {filters.search || activeFilterCount > 0
                                            ? 'Aucun résultat pour les filtres sélectionnés.'
                                            : 'Aucune feuille de pointage enregistrée.'}
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
