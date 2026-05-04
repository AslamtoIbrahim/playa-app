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

interface Props {
    workers: Worker[];
}

export default function Workers({ workers }: Props) {
    return (
        <>
            <Head title="Ouvriers" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Liste des Ouvriers</h1>

                    <AddWorkerDialog />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 md:min-h-min dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-25">ID</TableHead>

                                <TableHead>Nom Complet</TableHead>

                                <TableHead className="text-center">Pointages</TableHead>

                                <TableHead className="text-left">Date d'embauche</TableHead>

                                <TableHead className="w-20 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell className="font-medium text-muted-foreground">
                                        #{worker.id}
                                    </TableCell>

                                    <TableCell className="font-semibold capitalize">
                                        {worker.name}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            {worker.attendances_count || 0} séances
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-left text-sm text-muted-foreground">
                                        {new Date(worker.created_at).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
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
                            ))}
                        </TableBody>
                    </Table>
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