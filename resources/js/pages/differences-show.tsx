import { ExportDropdown } from '@/components/export-dropdown';
import { TaxFreeDialog } from '@/components/tax-free-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDifferenceExport } from '@/hooks/use-difference-export';
import { useScreenshot } from '@/hooks/use-screenshot';
import AppLayout from '@/layouts/app-layout';
import { formatDateDisplay } from '@/lib/date';
import { Difference } from '@/types/difference';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Camera, Printer, Receipt } from "lucide-react";
import React, { useState } from 'react';

interface DifferenceWithInvoice extends Difference {
    invoice_item?: Difference['invoice_item'] & {
        invoice?: { date: string };
        boat?: { name: string };
        item?: { name: string };
    };
}

interface Props {
    details: DifferenceWithInvoice[];
    total_boxes: number
    total_amount: number
}

export default function DifferenceShow({ details, total_boxes, total_amount }: Props) {

    const [isTaxFreeOpen, setIsTaxFreeOpen] = useState(false);
    
    const { copyToClipboard } = useScreenshot();

    const { exportToExcel, exportToPDF } = useDifferenceExport();

    const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
        if (type === 'excel') {
            exportToExcel(details, details[0]?.customer?.name || 'Client');
        }

        if (type === 'pdf') {
            exportToPDF(details, total_boxes, total_amount);
        }
    };


    const handlePrint = () => {
        window.print();
    };

    const handleScreenshot = () => {
        copyToClipboard('difference-content', {
            style: { width: '210mm' }
        });
    };



    if (details.length === 0) {
        return (
            <div className="flex h-100 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                Aucune donnée trouvée.
            </div>
        );
    }

    const first = details[0];



    return (
        <div className="min-h-screen bg-slate-50/50 md:p-8 print:bg-white print:p-0">
            <Head title={`Rapport - ${first.customer?.name}`} />

            {/* Actions Bar - shadcn style */}
            <div className="mx-auto mb-8 flex max-w-4xl items-center justify-between print:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft className="h-4 w-4" /> Retour
                </Button>

                <div className='flex gap-3'>

                    <Button
                        onClick={() => setIsTaxFreeOpen(true)}
                        variant="outline"
                        size="sm"
                        title="Hors taxe"
                        className="h-9 border-blue-100 bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm"
                    >
                        <Receipt className="h-4 w-4" />
                    </Button>

                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        size="sm"
                        className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                    >
                        <Printer className="h-3 w-3" />
                    </Button>
                    <Button
                        onClick={handleScreenshot}
                        variant="outline"
                        size="sm"
                        title="Copy for WhatsApp"
                        className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                    <ExportDropdown onExport={handleExport} />
                </div>
            </div>

            {/* Main Sheet - Card Based */}
            <Card id="difference-content" className="mx-auto max-w-[210mm] border-none shadow-none print:shadow-none md:shadow-sm ">
                <CardContent className="p-8 md:px-12 print:p-2 overflow-hidden">

                    {/* Header Section */}
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex flex-col md:items-end">
                            <span className="text-lg font-semibold">{formatDateDisplay(first.invoice_item?.invoice?.date)}</span>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 gap-12 mb-10">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client Destination</span>
                            <p className="text-lg font-bold capitalize tracking-tight text-slate-900">
                                {first.customer?.name}
                            </p>
                        </div>
                        <div className="space-y-1 md:text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bateau</span>
                            <p className="text-lg font-bold uppercase tracking-tight text-slate-900">
                                {first.invoice_item?.boat?.name || 'Non spécifié'}
                            </p>
                        </div>
                    </div>

                    {/* shadcn Table wrapper */}
                    <div className="rounded-md border border-slate-100 ">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[30%] font-bold text-foreground">Article</TableHead>
                                    <TableHead className="text-center font-bold text-foreground">Qté</TableHead>
                                    <TableHead className="text-right font-bold text-foreground">Réel</TableHead>
                                    <TableHead className="text-right font-bold text-foreground">Prix Unitaire</TableHead>
                                    <TableHead className="text-right font-bold text-foreground">Montant</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {details.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-transparent">
                                        <TableCell className="font-semibold capitalize text-slate-700">
                                            {item.invoice_item?.item?.name}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {item.unit_count}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {Number(item.real_price).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground tabular-nums">
                                            {Number(item.invoice_item?.unit_price).toFixed(2)}
                                        </TableCell>

                                        <TableCell className={`text-right font-bold tabular-nums ${Number(item.total_diff) < 0 ? 'text-red-500' : Number(item.total_diff) > 0 ? 'text-green-700' : 'text-slate-700'}`}>
                                            {Number(item.total_diff) > 0 ? '+' : ''}{Number(item.total_diff).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Summary & Totals */}
                    <div className="mt-10 flex flex-col items-end gap-3">
                        <div className="flex w-full max-w-60 justify-between px-2 text-sm text-muted-foreground">
                            <span>Total Caisses</span>
                            <span className="font-medium text-foreground">{total_boxes}</span>
                        </div>
                        <div className="w-full max-w-65 bg-slate-50/50 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total Montant</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black tabular-nums tracking-tight">
                                        {total_amount}
                                    </span>
                                    <span className="text-[10px] font-bold">DH</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Tax Free */}
            <TaxFreeDialog 
                open={isTaxFreeOpen} 
                onOpenChange={setIsTaxFreeOpen}
                details={details}
                customerName={first.customer?.name}
                customerId={first.customer_id}
            />
        </div>
    );
}

DifferenceShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Differences', href: '/differences' },
            { title: 'Détails du Rapport', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);


