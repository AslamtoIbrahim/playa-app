import { Head } from '@inertiajs/react';
import AddAccountDialog from '@/components/add-account-dialog';
import DeleteAccountDialog from '@/components/delete-account-dialog';
import EditAccountDialog from '@/components/edit-account-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import type { Account } from '@/types/accounts';


interface Props {
    accounts: Account[];
}

export default function Accounts({ accounts }: Props) {
    return (
        <>
            <Head title="Comptes" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Liste des Comptes</h1>
                    <AddAccountDialog />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border bg-white p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-25">ID</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Titre</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-left">Date de création</TableHead>
                                <TableHead className="text-center w-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">#{account.id}</TableCell>
                                    <TableCell>{account.name}</TableCell>
                                    <TableCell>{account.title}</TableCell>
                                    <TableCell>
                                        <span className="capitalize">{account.type}</span>
                                    </TableCell>
                                    <TableCell className="text-left text-muted-foreground text-sm">
                                        {new Date(account.created_at).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <EditAccountDialog account={account} />
                                            <DeleteAccountDialog
                                                accountId={account.id}
                                                accountName={account.name}
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

Accounts.layout = {
    breadcrumbs: [
        {
            title: 'Comptes',
            href: '/accounts',
        },
    ],
};