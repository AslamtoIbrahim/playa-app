import { formatDateDisplay } from '@/lib/date';
import { Invoice } from '@/types/invoice';
import { ShieldCheck, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
    invoice: Invoice;
}

export function InvoiceHeader({ invoice }: Props) {

    return (
        <div className="flex flex-row items-start justify-between border-b pb-8 border-slate-100">
            {/* Left Side: Beneficiary & Caution */}
            <div className="text-left space-y-3">
                <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900 capitalize">
                        {invoice.billable?.name || '---'}
                    </p>

                    {invoice.office_room && (
                        <p className="text-xs font-medium text-slate-500">
                            {invoice.office_room.name} — {invoice.office_room.city}
                        </p>
                    )}
                </div>

                {invoice.caution && (
                    <Badge variant="secondary" className="bg-blue-50 text-indigo-700 border-blue-100 hover:bg-blue-50 gap-1.5 px-2.5 py-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {invoice.caution.name}
                        </span>
                    </Badge>
                )}
            </div>

            {/* Right Side: Invoice Details */}
            <div className="flex flex-col items-end space-y-2">
                <div className="space-y-1">
                    <h1 className="font-black text-right tracking-tighter text-slate-900">
                        {invoice.invoice_number}
                    </h1>
                </div>

                <Badge variant="outline" className="bg-slate-50/50 text-slate-600 border-slate-200 gap-2 px-3 py-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-bold">
                        {formatDateDisplay(invoice.date)}
                    </span>
                </Badge>
            </div>
        </div>
    );
}