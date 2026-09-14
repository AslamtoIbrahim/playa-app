import AddCompanyDialog from '@/components/add-company-dialog';
import DeleteCompanyDialog from '@/components/delete-company-dialog';
import EditCompanyDialog from '@/components/edit-company-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import type { Company } from '@/types/company';
import { Head } from '@inertiajs/react';
import { Building2, CalendarDays } from 'lucide-react';

interface Props {
    companies: Company[];
}

export default function Companies({ companies }: Props) {
    return (
        <>
            <Head title="Sociétés" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Liste des Sociétés
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion de la liste des sociétés enregistrées.
                        </p>
                    </div>

                    <AddCompanyDialog />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">ID</TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">Nom de la société</TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">Date de création</TableHead>
                                <TableHead className="w-20 text-center font-bold text-neutral-800 dark:text-neutral-200">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {companies.length > 0 ? (
                                companies.map((company) => (
                                    <TableRow
                                        key={company.id}
                                        className="group border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                            #{company.id}
                                        </TableCell>

                                        <TableCell className="font-semibold capitalize text-slate-900 dark:text-neutral-100">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {company.name}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {formatDateDisplay(company.created_at)}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <EditCompanyDialog company={company} />

                                                <DeleteCompanyDialog
                                                    companyId={company.id}
                                                    companyName={company.name}
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
                                        Aucune société enregistrée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <Building2 className="h-4 w-4" />
                            {companies.length} Sociétés au total
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Companies.layout = {
    breadcrumbs: [
        {
            title: 'Sociétés',
            href: '/companies',
        },
    ],
};
