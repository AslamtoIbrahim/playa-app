import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import { Customer } from '@/types/customers';
import { Head, router } from '@inertiajs/react';

interface Report {
    customer_id: number;
    invoice_date: string;
    total_diff_amount: number;
    items_count: number;
    boat_name?: string;  
    customer?: Customer;
}

interface Props {
    reports: Report[];
}

export default function Differences({ reports }: Props) {

    const viewReport = (customerId: number, date: string): void => {
        router.visit(`/differences/report?customer_id=${customerId}&date=${date}`);
    };

    return (
        <div className="p-6 space-y-6">
            <Head title="Archives des Écarts" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Archives des Écarts</h1>
                    <p className="text-muted-foreground text-sm">Historique groupé par client et par date.</p>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="px-6 border-b border-slate-50">
                    <CardTitle className="text-lg font-black uppercase text-slate-400">Liste des Écarts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-bold">Date Facture</TableHead>
                                <TableHead className="font-bold">Client</TableHead>
                                <TableHead className="font-bold text-center">Bateau</TableHead>  
                                <TableHead className="text-right font-bold">Total Écart</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-medium">
                                        Aucun écart enregistré.
                                    </TableCell>
                                </TableRow>
                            )}

                            {reports.map((item) => (
                                <TableRow 
                                    key={`${item.customer_id}-${item.invoice_date}`} 
                                    className="group cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => viewReport(item.customer_id, item.invoice_date)}
                                >
                                    <TableCell className="font-medium text-slate-600">
                                        {formatDateDisplay(item.invoice_date)}
                                    </TableCell>

                                    <TableCell className="font-bold text-slate-900 capitalize">
                                        {item.customer?.name}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <span className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                                            {item.boat_name || '---'}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <span className={`font-black text-sm ${
                                            Number(item.total_diff_amount) >= 0 ? 'text-slate-900' : 'text-rose-600'
                                        }`}>
                                            {Number(item.total_diff_amount) > 0 ? '+' : ''}
                                            {Number(item.total_diff_amount).toLocaleString()} DH
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}