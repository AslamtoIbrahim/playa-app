import AddAccountDialog from '@/components/add-customer-dialog';
import DeleteCustomerDialog from '@/components/delete-customer-dialog';
import EditCustomerDialog from '@/components/edit-customer-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Customer } from '@/types/customers';
import { Head } from '@inertiajs/react';

interface Props {
    customers: Customer[];
}

export default function Customers({ customers }: Props) {
    return (
        <>
            <Head title="Clients" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Liste des Clients</h1>
                    <AddAccountDialog />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 md:min-h-min dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-25">ID</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead className="text-left">
                                    Date de création
                                </TableHead>
                                <TableHead className="w-20 text-center">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">
                                        #{customer.id}
                                    </TableCell>
                                    <TableCell className='capitalize font-medium'>{customer.name}</TableCell>
                                    <TableCell className="text-left text-sm text-muted-foreground">
                                        {new Date(
                                            customer.created_at,
                                        ).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <EditCustomerDialog
                                                customer={customer}
                                            />
                                            <DeleteCustomerDialog
                                                customerId={customer.id}
                                                customerName={customer.name}
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

Customers.layout = {
    breadcrumbs: [
        {
            title: 'Clients',
            href: '/customers',
        },
    ],
};