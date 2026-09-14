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

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-neutral-100">
                            <Ship className="h-6 w-6 text-blue-600" />
                            Flotte des Bateaux
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gérez vos bateaux et leurs propriétaires.
                        </p>
                    </div>

                    <AddBoatDialog owners={owners} />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Bateau
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Propriétaire
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Date d'ajout
                                </TableHead>
                                <TableHead className="w-20 text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {boats.length > 0 ? (
                                boats.map((boat: Boat) => {
                                    const isCompany = boat.owner_type.includes('Company');

                                    return (
                                        <TableRow
                                            key={boat.id}
                                            className="group border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        >
                                            <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                                #{boat.id}
                                            </TableCell>

                                            <TableCell className="font-semibold capitalize text-slate-900 dark:text-neutral-100">
                                                <div className="flex items-center gap-2">
                                                    <Ship className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {boat.name}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        {isCompany ? (
                                                            <Building2 className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                        ) : (
                                                            <User className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                        )}
                                                        <span className="font-medium text-slate-700 dark:text-neutral-200">
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

                                            <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">
                                                        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                                            <path d="M8 2v4M16 2v4M3 10h18" />
                                                        </svg>
                                                    </span>
                                                    {formatDateDisplay(boat.created_at)}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
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
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucun bateau trouvé dans la flotte.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                            <Ship className="h-4 w-4" />
                            {boats.length} Bateaux au total
                        </div>
                    </div>
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