import { Head, Link } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Facture } from '@/types/factures';
import type { Account } from '@/types/accounts';
import AddFactureDialog from '@/components/add-facture-dialog';
import EditFactureDialog from '@/components/edit-facture-dialog';
import DeleteFactureDialog from '@/components/delete-facture-dialog';
import AddPaymentDialog from '@/components/add-payment-dialog'; // تأكد من المسار

interface Props {
    factures: {
        data: Facture[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    accounts: Account[];
}

const statusStyles: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
    partially_paid: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200',
    unpaid: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200',
    pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
};

export default function Factures({ factures, accounts }: Props) {
    return (
        <>
            <Head title="Factures" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Factures List</h1>
                        <p className="text-sm text-muted-foreground">Manage your invoices and track payments.</p>
                    </div>
                    <AddFactureDialog accounts={accounts} />
                </div>

                <div className="relative flex-1 rounded-xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">Number</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className='text-right'>Amount (DH)</TableHead>
                                <TableHead className='text-right text-green-600'>Paid (DH)</TableHead>
                                <TableHead className='text-center'>Weight (KG)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {factures.data.map((facture) => (
                                <TableRow key={facture.id} className="group">
                                    <TableCell className="font-bold text-blue-600">
                                        {facture.number}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {facture.account?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground italic">
                                        {new Date(facture.date).toLocaleDateString('en-GB')}
                                    </TableCell>
                                    <TableCell className="font-semibold text-right">
                                        {new Intl.NumberFormat().format(facture.amount)}
                                    </TableCell>
                                    <TableCell className="font-semibold text-right text-green-600">
                                        {/* نعتبر أن facture.total_paid مصيفطاه من الـ Controller عبر الـ sum */}
                                        {/* {new Intl.NumberFormat().format(facture.total_paid || 0)} */}
                                        {new Intl.NumberFormat().format(facture.total_paid || facture.payments_sum_amount || 0)} DH
                                    </TableCell>
                                    <TableCell className='text-center text-muted-foreground'>
                                        {facture.weight ? `${facture.weight} kg` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn("capitalize shadow-none", statusStyles[facture.status])}
                                        >
                                            {facture.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            {/* زرار الخلاص كيبان غير يلا ما كانتش مخلصة كاملة */}
                                            {facture.status !== 'paid' && (
                                                <AddPaymentDialog facture={facture} />
                                            )}

                                            <EditFactureDialog facture={facture} accounts={accounts} />

                                            <DeleteFactureDialog
                                                factureId={facture.id}
                                                factureNumber={facture.number}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {factures.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                        No factures found. Start by adding a new one.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    {factures.total > 0 && (
                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                            <div className="text-sm text-muted-foreground">
                                Page {factures.current_page} of {factures.last_page}
                            </div>
                            <div className="flex gap-1">
                                {factures.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        className="h-8 min-w-8"
                                        asChild
                                        disabled={!link.url}
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// المساعد الصغير للـ Tailwind classes
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

Factures.layout = (page: any) => ({
    children: page,
    breadcrumbs: [
        {
            title: 'Factures',
            href: '/factures',
        },
    ],
});