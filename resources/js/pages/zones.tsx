import AddZoneDialog from '@/components/add-zone-dialog';
import DeleteZoneDialog from '@/components/delete-zone-dialog';
import EditZoneDialog from '@/components/edit-zone-dialog';
import { ZoneColumnFilter, ZoneSearch } from '@/components/zone-filters';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useZoneFilters } from '@/hooks/use-zone-filters';
import { formatDateDisplay } from '@/lib/date';
import type { Zone } from '@/types/zone';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, MapPin } from 'lucide-react';
import { useState } from 'react';

interface Props {
    zones: Zone[];
}

export default function Zones({ zones }: Props) {
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const { filters, setFilters, filteredZones, activeFilterCount } =
        useZoneFilters(zones);

    return (
        <>
            <Head title="Zones" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Liste des Zones
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion de la liste des zones de travail.
                        </p>
                    </div>

                    <AddZoneDialog />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <ZoneSearch
                            value={filters.search}
                            onChange={(search) =>
                                setFilters((current) => ({
                                    ...current,
                                    search,
                                }))
                            }
                            showColumnFilters={showColumnFilters}
                            activeFilterCount={activeFilterCount}
                            onToggleColumnFilters={() =>
                                setShowColumnFilters((current) => !current)
                            }
                        />
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {filteredZones.length} / {zones.length} zones
                        </span>
                    </div>
                    <Table>
                        <TableHeader
                            className={`bg-neutral-50/50 dark:bg-neutral-800/50 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                        >
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        ID
                                        <ZoneColumnFilter
                                            column="id"
                                            title="ID"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Nom
                                        <ZoneColumnFilter
                                            column="name"
                                            title="Nom"
                                            options={[
                                                ...new Set(
                                                    zones.map(
                                                        (zone) => zone.name,
                                                    ),
                                                ),
                                            ].sort((a, b) =>
                                                a.localeCompare(b, 'fr'),
                                            )}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Date de création
                                        <ZoneColumnFilter
                                            column="created_at"
                                            title="Date de création"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="w-20 text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredZones.length > 0 ? (
                                filteredZones.map((zone) => {
                                    return (
                                        <TableRow
                                            key={zone.id}
                                            className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                            onClick={() =>
                                                router.visit(
                                                    `/zones/${zone.id}`,
                                                )
                                            }
                                        >
                                            <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                                #{zone.id}
                                            </TableCell>

                                            <TableCell className="font-semibold text-slate-900 capitalize dark:text-neutral-100">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {zone.name}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {formatDateDisplay(
                                                        zone.created_at,
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell
                                                className="text-center"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="flex justify-center gap-2">
                                                    <EditZoneDialog
                                                        zone={zone}
                                                    />

                                                    <DeleteZoneDialog
                                                        zoneId={zone.id}
                                                        zoneName={zone.name}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucune zone enregistrée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <MapPin className="h-4 w-4" />
                            {zones.length} Zones au total
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Zones.layout = {
    breadcrumbs: [
        {
            title: 'Zones',
            href: '/zones',
        },
    ],
};
