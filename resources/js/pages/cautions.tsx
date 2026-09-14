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
import { Building2, CalendarDays, ShieldCheck, User } from 'lucide-react';

interface Props {
    cautions: Caution[];
    owners: Owner[];
}

export default function Cautions({ cautions, owners }: Props) {
    return (
        <>
            <Head title="Cautions" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Gestion des Cautions
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Suivez les cautions déposées par les clients et les sociétés.
                        </p>
                    </div>

                    <AddCautionDialog owners={owners} />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Désignation
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Propriétaire
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Date de création
                                </TableHead>
                                <TableHead className="w-20 text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {cautions.length > 0 ? (
                                cautions.map((caution: Caution) => {
                                    const isCompany = caution.owner_type.includes('Company');

                                    return (
                                        <TableRow
                                            key={caution.id}
                                            className="group border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        >
                                            <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                                #{caution.id}
                                            </TableCell>

                                            <TableCell className="font-semibold capitalize text-slate-900 dark:text-neutral-100">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {caution.name}
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
                                                            {caution.owner?.name || 'Inconnu'}
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
                                                    <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {formatDateDisplay(caution.created_at)}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
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
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucune caution trouvée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <ShieldCheck className="h-4 w-4" />
                            {cautions.length} Cautions au total
                        </div>
                    </div>
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