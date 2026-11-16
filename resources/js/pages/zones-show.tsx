import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AddSessionForZoneDialog from '@/components/add-session-for-zone-dialog';
import EditSessionForZoneDialog from '@/components/edit-session-for-zone-dialog';
import {
    ZoneSessionColumnFilter,
    ZoneSessionFilterSummary,
    ZoneSessionSearch,
} from '@/components/zone-session-filters';
import { ZoneSelectionStatistics } from '@/components/zone-selection-statistics';
import {
    getZoneSessionRowId,
    useZoneCellSelection,
} from '@/hooks/use-zone-cell-selection';
import type { ZoneSelectionField } from '@/hooks/use-zone-cell-selection';
import { useZoneSessionFilters } from '@/hooks/use-zone-session-filters';
import type { ZoneDailySession } from '@/hooks/use-zone-session-filters';
import { formatDateDisplay } from '@/lib/date';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Lock,
    MapPin,
    Unlock,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

const DEFAULT_PAGE_SIZE = 10;

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
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const {
        filters,
        setFilters: setCurrentFilters,
        filteredSessions,
        activeFilterCount,
        clearColumnFilters,
    } = useZoneSessionFilters(dailySessions);
    const setFilters: typeof setCurrentFilters = (nextFilters) => {
        setCurrentFilters(nextFilters);
        setPage(1);
    };
    const pageCount = Math.max(
        1,
        Math.ceil(filteredSessions.length / pageSize),
    );
    const currentPage = Math.min(page, pageCount);
    const pageSessions = useMemo(
        () =>
            filteredSessions.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize,
            ),
        [currentPage, filteredSessions, pageSize],
    );
    const firstItem = filteredSessions.length
        ? (currentPage - 1) * pageSize + 1
        : 0;
    const lastItem = Math.min(currentPage * pageSize, filteredSessions.length);
    const hasActiveFilters =
        filters.search.trim().length > 0 || activeFilterCount > 0;
    const {
        setSelection: setCellSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics: selectionStatistics,
    } = useZoneCellSelection(pageSessions);
    const cellSelectDrag = useRef<{
        rowId: string;
        field: ZoneSelectionField;
    } | null>(null);

    const toggleColumnFilters = () => {
        if (showColumnFilters) {
            clearColumnFilters();
            setPage(1);
            setShowColumnFilters(false);

            return;
        }

        setShowColumnFilters(true);
    };

    const getSelectionCellProps = (
        rowId: string,
        field: ZoneSelectionField,
    ) => {
        const selectedCell = getSelectedCellRange(rowId);
        const selected = selectedCell?.includes(`|${rowId}:${field}|`) ?? false;

        return {
            'data-zone-cell': field,
            'data-zone-row': rowId,
            tabIndex: -1,
            onMouseDownCapture: (
                event: ReactMouseEvent<HTMLTableCellElement>,
            ) => {
                selectCell(rowId, field, event.shiftKey);
                cellSelectDrag.current = event.shiftKey
                    ? null
                    : { rowId, field };
            },
            onClick: (event: ReactMouseEvent<HTMLTableCellElement>) => {
                event.stopPropagation();
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

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const drag = cellSelectDrag.current;
            const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>('[data-zone-cell][data-zone-row]');

            if (
                drag &&
                target?.dataset.zoneCell === drag.field &&
                target.dataset.zoneRow
            ) {
                extendSelection(target.dataset.zoneRow, drag.field);
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
                    '[data-zone-cell], [data-zone-selection-statistics]',
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

    useEffect(() => {
        setCellSelection(null);
    }, [currentPage, filteredSessions, pageSize, setCellSelection]);

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
                        <div className="flex items-center gap-2">
                            <ZoneSelectionStatistics
                                statistics={selectionStatistics}
                            />
                            <span className="text-xs text-muted-foreground">
                                {filteredSessions.length} /{' '}
                                {dailySessions.length} lignes
                            </span>
                        </div>
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
                            {pageSessions.length > 0 ? (
                                pageSessions.map((session, index) => {
                                    const margin =
                                        session.total_sell - session.total_buy;
                                    const selectionRowId = getZoneSessionRowId(
                                        session,
                                        index,
                                    );

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
                                            <TableCell
                                                {...getSelectionCellProps(
                                                    selectionRowId,
                                                    'total_buy',
                                                )}
                                                className="text-right font-mono"
                                            >
                                                {formatCurrency(
                                                    session.total_buy,
                                                )}
                                            </TableCell>
                                            <TableCell
                                                {...getSelectionCellProps(
                                                    selectionRowId,
                                                    'total_sell',
                                                )}
                                                className="text-right font-mono text-blue-600"
                                            >
                                                {formatCurrency(
                                                    session.total_sell,
                                                )}
                                            </TableCell>
                                            <TableCell
                                                {...getSelectionCellProps(
                                                    selectionRowId,
                                                    'margin',
                                                )}
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
                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <CalendarDays className="h-4 w-4" />
                            {firstItem}–{lastItem} sur {filteredSessions.length}{' '}
                            journée(s)
                            {hasActiveFilters &&
                                ` sur ${dailySessions.length} au total`}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                                <label htmlFor="zone-session-page-size">
                                    Lignes par page
                                </label>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger
                                        id="zone-session-page-size"
                                        aria-label="Lignes par page"
                                        className="h-9 w-[76px]"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent side="top" align="end">
                                        {[10, 25, 50, 100].map((size) => (
                                            <SelectItem
                                                key={size}
                                                value={String(size)}
                                            >
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {pageCount > 1 && (
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        aria-label="Page précédente"
                                        disabled={currentPage <= 1}
                                        onClick={() => setPage(currentPage - 1)}
                                        className="h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from(
                                        { length: pageCount },
                                        (_, index) => index + 1,
                                    ).map((pageNumber) => (
                                        <Button
                                            key={pageNumber}
                                            type="button"
                                            variant={
                                                pageNumber === currentPage
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            aria-label={`Page ${pageNumber}`}
                                            aria-current={
                                                pageNumber === currentPage
                                                    ? 'page'
                                                    : undefined
                                            }
                                            onClick={() => setPage(pageNumber)}
                                            className={`h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 ${
                                                pageNumber === currentPage
                                                    ? 'scale-105 shadow-md dark:bg-primary dark:text-primary-foreground'
                                                    : ''
                                            }`}
                                        >
                                            {pageNumber}
                                        </Button>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        aria-label="Page suivante"
                                        disabled={currentPage >= pageCount}
                                        onClick={() => setPage(currentPage + 1)}
                                        className="h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
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
