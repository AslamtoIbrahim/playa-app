import { Head, Link, router } from '@inertiajs/react';
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
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Payment } from '@/types/payments';
import EditPaymentDialog from '@/components/edit-payment-dialog';
import DeletePaymentDialog from '@/components/delete-payment-dialog';

interface Props {
    payments: {
        data: Payment[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function Payments({ payments }: Props) {

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this payment? The invoice status will be updated automatically.')) {
            router.delete(`/payments/${id}`, {
                onSuccess: () => toast.success('Payment deleted successfully! 🗑️'),
            });
        }
    };

    return (
        <>
            <Head title="Payments" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Payments History</h1>
                </div>

                <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Facture No.</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Amount (DH)</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.data.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>
                                        {format(parseISO(payment.payment_date), 'd/M/yyyy')}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {payment.facture?.account?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-blue-600 font-mono">
                                        {payment.facture?.number}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {payment.method}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-green-600">
                                        {new Intl.NumberFormat().format(payment.amount)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm italic">
                                        {payment.reference || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <EditPaymentDialog payment={payment} />
                                            <DeletePaymentDialog
                                                paymentId={payment.id}
                                                amount={payment.amount}
                                                factureNumber={payment.facture?.number}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {payments.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No payments recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {payments.total > 0 && (
                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                            <div className="text-sm text-muted-foreground">
                                Page {payments.current_page} of {payments.last_page}
                            </div>
                            <div className="flex gap-1">
                                {payments.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
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

Payments.layout = (page: any) => ({
    children: page,
    breadcrumbs: [{ title: 'Payments', href: '/payments' }],
});