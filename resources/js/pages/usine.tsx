import AddUsineDialog from '@/components/add-usine-dialog';
import DeleteUsineDialog from '@/components/delete-usine-dialog';
import EditUsineDialog from '@/components/edit-usine-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import { show } from '@/routes/usines';
import type { Usine } from '@/types/usine';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, CalendarDays } from 'lucide-react';

interface Props {
    usines: Usine[];
}

export default function UsinePage({ usines }: Props) {
    return (
        <>
            <Head title="Usines" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Liste des usines
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion de la liste des usines enregistrées.
                        </p>
                    </div>

                    <AddUsineDialog />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Nom de l’usine
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
                            {usines.length > 0 ? (
                                usines.map((usine) => (
                                    <TableRow
                                        key={usine.id}
                                        className="group cursor-pointer border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        onClick={() =>
                                            router.visit(show(usine.id).url)
                                        }
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                            #{usine.id}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900 capitalize dark:text-neutral-100">
                                            <Link
                                                href={show(usine.id)}
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                                className="flex items-center gap-2"
                                            >
                                                <Building2 className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {usine.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {formatDateDisplay(
                                                    usine.created_at,
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div
                                                className="flex justify-center gap-2"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                <EditUsineDialog
                                                    usine={usine}
                                                />
                                                <DeleteUsineDialog
                                                    usineId={usine.id}
                                                    usineName={usine.name}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucune usine enregistrée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <Building2 className="h-4 w-4" />
                            {usines.length} usine(s) au total
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

UsinePage.layout = {
    breadcrumbs: [
        {
            title: 'Usines',
            href: '/usines',
        },
    ],
};
