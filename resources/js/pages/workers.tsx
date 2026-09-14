import AddWorkerDialog from '@/components/add-worker-dialog';
import DeleteWorkerDialog from '@/components/delete-worker-dialog';
import EditWorkerDialog from '@/components/edit-worker-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Worker } from '@/types/worker';
import { Head } from '@inertiajs/react';
import { CalendarDays, Users } from 'lucide-react';

interface Props {
    workers: Worker[];
}

export default function Workers({ workers }: Props) {
    return (
        <>
            <Head title="Ouvriers" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Liste des Ouvriers
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion de la liste des ouvriers et de leur historique de pointage.
                        </p>
                    </div>

                    <AddWorkerDialog />
                </div>


                {/* Table Card */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    ID
                                </TableHead>

                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Nom Complet
                                </TableHead>

                                <TableHead className="text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Pointages
                                </TableHead>

                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Date d'embauche
                                </TableHead>

                                <TableHead className="w-20 text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {workers.length > 0 ? (
                                workers.map((worker) => (
                                    <TableRow
                                        key={worker.id}
                                        className="group border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                            #{worker.id}
                                        </TableCell>

                                        <TableCell className="font-semibold capitalize text-slate-900 dark:text-neutral-100">
                                            {worker.name}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                                {worker.attendances_count || 0} séances
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {new Date(worker.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <EditWorkerDialog worker={worker} />

                                                <DeleteWorkerDialog 
                                                    workerId={worker.id} 
                                                    workerName={worker.name} 
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
                                        Aucun ouvrier enregistré.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Footer counter */}
                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {workers.length} Ouvriers au total
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Workers.layout = {
    breadcrumbs: [
        {
            title: 'Ouvriers',
            href: '/workers',
        },
    ],
};