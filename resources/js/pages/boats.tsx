import AddBoatDialog from '@/components/add-boat-dialog';
import DeleteBoatDialog from '@/components/delete-boat-dialog';
import EditBoatDialog from '@/components/edit-boat-dialog';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import type { Boat, Owner } from '@/types/boat';
import { Head } from '@inertiajs/react';
import { Ship, User, Building2 } from 'lucide-react';

 

interface Props {
    boats: Boat[];
    owners: Owner[];
}

export default function Boats({ boats, owners }: Props) {
    return (
        <>
            <Head title="Bateaux" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            <Ship className="h-5 w-5 text-blue-600" />
                            Flotte des Bateaux
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gérez vos bateaux et leurs propriétaires.
                        </p>
                    </div>

                    <AddBoatDialog owners={owners} />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 dark:border-sidebar-border dark:bg-neutral-900 md:min-h-min">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">ID</TableHead>
                                <TableHead>Bateau</TableHead>
                                <TableHead>Propriétaire</TableHead>
                                <TableHead className="text-left">Date d'ajout</TableHead>
                                <TableHead className="w-24 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {boats.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Aucun bateau trouvé dans la flotte.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                boats.map((boat: Boat) => {
                                    const isCompany = boat.owner_type.includes('Company');

                                    return (
                                        <TableRow key={boat.id}>
                                            <TableCell className="font-medium">
                                                #{boat.id}
                                            </TableCell>

                                            <TableCell className="font-bold text-slate-900 dark:text-neutral-100">
                                                {boat.name}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        {isCompany ? (
                                                            <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
                                                        ) : (
                                                            <User className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
                                                        )}
                                                        <span className="text-sm font-medium tracking-tight">
                                                            {boat.owner?.name || 'Non assigné'}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        {isCompany ? (
                                                            <Badge
                                                                variant="secondary"
                                                                className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-bold uppercase text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
                                                            >
                                                                Société
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] font-bold uppercase text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400"
                                                            >
                                                                Client
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-left text-sm text-muted-foreground font-medium">
                                                {formatDateDisplay(boat.created_at)}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex justify-center gap-1">
                                                    <EditBoatDialog
                                                        boat={boat}
                                                        owners={owners}
                                                    />
                                                    
                                                    <DeleteBoatDialog
                                                        boatId={boat.id}
                                                        boatName={boat.name}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

Boats.layout = {
    breadcrumbs: [
        {
            title: 'Flotte',
            href: '/boats',
        },
        {
            title: 'Bateaux',
            href: '/boats',
        },
    ],
};