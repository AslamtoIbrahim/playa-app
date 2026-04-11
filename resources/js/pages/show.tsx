import { Head } from '@inertiajs/react';
import InvoiceItemRow from '@/components/invoice-item-row';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Show({ invoice, boats, items }: any) {
    
    const netToPay = Number(invoice.amount || 0);
    const tvaAmount = Number(invoice.tva || 0);
    const totalBoxes = Number(invoice.boxes || 0);
    const totalWeight = Number(invoice.weight || 0);

    const totalHT = netToPay - tvaAmount - totalBoxes;

    // دالة لتحويل التاريخ من 2026-04-10 إلى 10-04-2026
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto bg-white min-h-screen text-slate-900 font-sans">
            <Head title={`Facture ${invoice.invoice_number}`} />

            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">{invoice.invoice_number}</h1>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Détails de la Facture</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold">{invoice.account?.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{formatDate(invoice.date)}</p>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-none border-slate-100 h-24 flex flex-col justify-center">
                    <CardContent className="p-4 py-0">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total Caisses</p>
                        <p className="text-xl font-bold text-slate-700">
                            {totalBoxes} <span className="text-xs font-normal opacity-50">U</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none border-slate-100 h-24 flex flex-col justify-center">
                    <CardContent className="p-4 py-0">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total Poids</p>
                        <p className="text-xl font-bold text-slate-700">
                            {totalWeight.toFixed(2)} <span className="text-xs font-normal opacity-50">KG</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none border-slate-100 h-24 flex flex-col justify-center">
                    <CardContent className="p-4 py-0">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total HT</p>
                        <p className="text-xl font-bold text-blue-600">
                            {totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none border-none bg-slate-900 text-white h-24 flex flex-col justify-center">
                    <CardContent className="p-4 py-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <p className="text-[9px] uppercase font-bold opacity-50 tracking-wider">Net à Payer</p>
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Total</span>
                        </div>
                        <p className="text-xl font-black tracking-tight">
                            {netToPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[10px] font-light opacity-60 ml-0.5">DH</span>
                        </p>
                        <div className="mt-1.5 flex justify-between items-center border-t border-white/10 pt-1">
                            <span className="text-[10px] opacity-40 font-bold uppercase">TVA (3%) + Emballage</span>
                            <span className="text-[12px] font-medium text-slate-400">+{ (tvaAmount + totalBoxes).toFixed(2) }</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table Area */}
            <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow className="h-11">
                            <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-500">Bateau</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-500">Espèces</TableHead>
                            <TableHead className="text-center text-[10px] font-black uppercase tracking-tight text-slate-500">Qte / NC</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-tight text-slate-500">Prix Unitaire</TableHead>
                            <TableHead className="text-center text-[10px] font-black uppercase tracking-tight text-slate-500">Unité</TableHead>
                            <TableHead className="text-center text-[10px] font-black uppercase tracking-tight text-slate-500">Poids</TableHead>
                            <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-tight text-blue-700">Valeur DH</TableHead>
                            <TableHead className="w-8"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.items?.map((row: any) => (
                            <InvoiceItemRow key={row.id} invoiceId={invoice.id} item={row} boats={boats} items={items} />
                        ))}
                        <InvoiceItemRow invoiceId={invoice.id} boats={boats} items={items} isNew={true} />
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}