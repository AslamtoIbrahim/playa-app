import AddCautionDialog from '@/components/add-caution-dialog';
import DeleteCautionDialog from '@/components/delete-caution-dialog';
import EditCautionDialog from '@/components/edit-caution-dialog';
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
import type { Caution, Owner } from '@/types/caution';
import { Head } from '@inertiajs/react';
import { ShieldCheck, User, Building2 } from 'lucide-react';

interface Props {
    cautions: Caution[];
    owners: Owner[];
}

export default function Cautions({ cautions, owners }: Props) {
    return (
        <>
            <Head title="Cautions" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            Gestion des Cautions
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Suivez les cautions déposées par les clients et les sociétés.
                        </p>
                    </div>

                    <AddCautionDialog owners={owners} />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 md:min-h-min dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">ID</TableHead>
                                <TableHead>Désignation</TableHead>
                                <TableHead>Propriétaire</TableHead>
                                <TableHead className="text-left">Date</TableHead>
                                <TableHead className="w-24 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {cautions.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Aucune caution trouvée.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cautions.map((caution: Caution) => {
                                    const isCompany = caution.owner_type.includes('Company');

                                    return (
                                        <TableRow key={caution.id}>
                                            <TableCell className="font-medium">
                                                #{caution.id}
                                            </TableCell>

                                            <TableCell className="font-bold text-slate-900 capitalize">
                                                {caution.name}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        {isCompany ? (
                                                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                                        ) : (
                                                            <User className="h-3.5 w-3.5 text-slate-500" />
                                                        )}
                                                        <span className="text-sm font-medium tracking-tight">
                                                            {caution.owner?.name || 'Inconnu'}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        {isCompany ? (
                                                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[10px] px-1.5 py-0 uppercase font-bold">
                                                                Société
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-[10px] px-1.5 py-0 uppercase font-bold">
                                                                Client
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-left text-sm text-muted-foreground font-medium">
                                                {formatDateDisplay(caution.created_at)}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex justify-center gap-1">
                                                    <EditCautionDialog
                                                        caution={caution}
                                                        owners={owners}
                                                    />
                                                    
                                                    <DeleteCautionDialog
                                                        cautionId={caution.id}
                                                        cautionName={caution.name}
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

Cautions.layout = {
    breadcrumbs: [
        {
            title: 'Paramètres',
            href: '#',
        },
        {
            title: 'Cautions',
            href: '/cautions',
        },
    ],
};