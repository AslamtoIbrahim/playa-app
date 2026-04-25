import { formatDateDisplay } from '@/lib/date';
import { Invoice } from '@/types/invoice';

interface Props {
    invoice: Invoice;
}

export function InvoiceHeader({ invoice }: Props) {
    return (
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">
                    {invoice.invoice_number}
                </h1>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    Détails de la Facture
                </p>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold">{invoice.billable?.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                    {formatDateDisplay(invoice.date)}
                </p>
            </div>
        </div>
    );
}