import { Head } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import type { OfficeRoom } from '@/types/office-room';
import AddOfficeRoomDialog from '@/components/add-office-room-dialog';
import DeleteOfficeRoomDialog from '@/components/delete-office-room-dialog';
import EditOfficeRoomDialog from '@/components/edit-office-room-dialog';
import { Building2, CalendarDays, MapPin } from 'lucide-react';

interface Props {
    officeRooms: OfficeRoom[];
}

export default function OfficeRooms({ officeRooms }: Props) {
    return (
        <>
            <Head title="Bureaux" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Liste des Bureaux
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion de la liste des bureaux enregistrés.
                        </p>
                    </div>

                    <AddOfficeRoomDialog />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">ID</TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">Nom du bureau</TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">Ville</TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">Date de création</TableHead>
                                <TableHead className="w-20 text-center font-bold text-neutral-800 dark:text-neutral-200">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {officeRooms.length > 0 ? (
                                officeRooms.map((room) => (
                                    <TableRow
                                        key={room.id}
                                        className="group border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                            #{room.id}
                                        </TableCell>

                                        <TableCell className="font-semibold capitalize text-slate-900 dark:text-neutral-100">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {room.name}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-700 uppercase dark:bg-neutral-800 dark:text-neutral-300">
                                                    {room.city || '—'}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {formatDateDisplay(room.created_at)}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <EditOfficeRoomDialog officeRoom={room} />

                                                <DeleteOfficeRoomDialog
                                                    officeRoomId={room.id}
                                                    officeRoomName={room.name}
                                                    officeRoomCity={room.city}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucun bureau enregistré.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <Building2 className="h-4 w-4" />
                            {officeRooms.length} Bureaux au total
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

OfficeRooms.layout = {
    breadcrumbs: [
        {
            title: 'Bureaux',
            href: '/office-rooms',
        },
    ],
};