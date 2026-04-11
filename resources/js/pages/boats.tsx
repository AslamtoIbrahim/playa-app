import { Head } from '@inertiajs/react';
import AddBoatDialog from '@/components/add-boat-dialog';
import EditBoatDialog from '@/components/edit-boat-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import type { Account } from '@/types/accounts';
import type { Boat } from '@/types/boat';
import DeleteBoatDialog from '@/components/delete-boat-dialog';

interface Props {
    boats: Boat[];
    accounts: Account[];
}

export default function Boats({ boats, accounts }: Props) {
    return (
        <>
            <Head title="Bateaux" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h1 className="text-xl font-semibold">Flotte des Bateaux</h1>
                        <p className="text-sm text-muted-foreground">Gérez vos bateaux et leurs propriétaires.</p>
                    </div>
                    <AddBoatDialog accounts={accounts} />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border bg-white p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-25">ID</TableHead>
                                <TableHead>Bateau</TableHead>
                                <TableHead>Propriétaire / Compte</TableHead>
                                <TableHead className="text-left">Date</TableHead>
                                <TableHead className="text-center w-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {boats.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Aucun bateau trouvé. Commencez par en ajouter un.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                boats.map((boat) => (
                                    <TableRow key={boat.id}>
                                        <TableCell>#{boat.id}</TableCell>
                                        <TableCell>{boat.name}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                {boat.account?.name || 'Aucun propriétaire'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-left text-muted-foreground text-sm">
                                            {new Date(boat.created_at).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <EditBoatDialog boat={boat} accounts={accounts} />
                                                <DeleteBoatDialog boatId={boat.id} boatName={boat.name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
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
            title: 'Bateaux',
            href: '/boats',
        },
    ],
};