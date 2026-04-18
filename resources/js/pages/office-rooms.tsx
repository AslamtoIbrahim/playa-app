import { Head } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { OfficeRoom } from '@/types/office-room';
import AddOfficeRoomDialog from '@/components/add-office-room-dialog';
import EditOfficeRoomDialog from '@/components/edit-office-room-dialog';
import DeleteOfficeRoomDialog from '@/components/delete-office-room-dialog';
import { Badge } from '@/components/ui/badge';
import { formatDateDisplay } from '@/lib/date';

interface Props {
    officeRooms: OfficeRoom[];
}

export default function OfficeRooms({ officeRooms }: Props) {
    return (
        <>
            <Head title="Bureaux" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Liste des Bureaux</h1>
                    <AddOfficeRoomDialog />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border bg-white p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">ID</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead className="text-left">Date Création</TableHead>
                                <TableHead className="text-center w-28">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {officeRooms.length > 0 ? (
                                officeRooms.map((room) => (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium">#{room.id}</TableCell>
                                        <TableCell className="font-medium">{room.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                                                {room.city || '—'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-left text-muted-foreground text-sm">
                                            {formatDateDisplay(room.created_at)}
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
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Aucun bureau trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
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