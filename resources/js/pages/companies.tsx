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
import type { Company } from '@/types/company';
import { Head } from '@inertiajs/react';

interface Props {
    companies: Company[];
}

export default function Companies({ companies }: Props) {
    return (
        <>
            <Head title="Sociétés" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Liste des Sociétés</h1>
                    <AddCompanyDialog />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 md:min-h-min dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-25">ID</TableHead>
                                <TableHead>Nom de la société</TableHead>
                                <TableHead className="text-left">
                                    Date de création
                                </TableHead>
                                <TableHead className="w-20 text-center">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                            {companies.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">
                                        #{company.id}
                                    </TableCell>
                                    
                                    <TableCell className="font-semibold capitalize">
                                        {company.name}
                                    </TableCell>
                                    
                                    <TableCell className="text-left text-sm text-muted-foreground">
                                        {new Date(company.created_at).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <EditCompanyDialog
                                                company={company}
                                            />
                                            <DeleteCompanyDialog
                                                companyId={company.id}
                                                companyName={company.name}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {companies.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Aucune société trouvée.
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

Companies.layout = {
    breadcrumbs: [
        {
            title: 'Sociétés',
            href: '/companies',
        },
    ],
};