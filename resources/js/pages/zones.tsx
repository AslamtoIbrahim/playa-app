import { Head } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Zone } from '@/types/zone'; // Assuming you have zone.ts defined
import AddZoneDialog from '@/components/add-zone-dialog'; // Assuming you have this component
import EditZoneDialog from '@/components/edit-zone-dialog'; // Assuming you have this component
import DeleteZoneDialog from '@/components/delete-zone-dialog'; // Assuming you have this component
import { Badge } from '@/components/ui/badge';
import { formatDateDisplay } from '@/lib/date';

interface Props {
    zones: Zone[];
}

export default function Zones({ zones }: Props) {
    return (
        <>
            <Head title="Zones" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Liste des Zones</h1>
                    <AddZoneDialog />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border bg-white p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">ID</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead className="text-left">Date Création</TableHead>
                                <TableHead className="text-center w-28">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {zones.length > 0 ? (
                                zones.map((zone) => (
                                    <TableRow key={zone.id}>
                                        <TableCell className="font-medium">#{zone.id}</TableCell>
                                        <TableCell className="font-medium">{zone.name}</TableCell>
                                        <TableCell className="text-left text-muted-foreground text-sm">
                                            {formatDateDisplay(zone.created_at)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <EditZoneDialog zone={zone} />
                                                <DeleteZoneDialog zoneId={zone.id} zoneName={zone.name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Aucune zone trouvée.
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

Zones.layout = {
    breadcrumbs: [
        {
            title: 'Zones',
            href: '/zones',
        },
    ],
};
