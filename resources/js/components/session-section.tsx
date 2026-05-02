// pages/sessions/components/session-section.tsx (Updated)
import { SessionGroupData } from '@/types/daily-session';
import { InvoiceDetailCard } from './invoice-detail-card';
import { DifferenceDetailCard } from './difference-detail-card';
import { ReceiptDetailCard } from './receipt-detail-card';
import { ScrollArea } from "@/components/ui/scroll-area";

interface SessionSectionProps {
    title: string;
    data: SessionGroupData;
    type: 'purchase' | 'sale';
}

export function SessionSection({ title, data, type }: SessionSectionProps) {
    return (
        <div className="space-y-6">
            <h2 className={`text-xl font-bold flex items-center justify-between`}>
                <span className="flex items-center gap-2">
                    <div className={`w-2 h-6 rounded-full ${type === 'purchase' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    {title}
                </span>
                <span className="text-sm font-mono bg-slate-100 px-3 py-1 rounded">
                    Total: {data.total.toLocaleString()} MAD
                </span>
            </h2>

            <div className="grid gap-4">
                {/* Invoices Section */}
                <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 ml-1">Factures</h3>
                    <ScrollArea className={data.invoices.length >= 3 ? "h-70" : ""}>
                        {data.invoices.map(inv => <InvoiceDetailCard key={inv.id} invoice={inv} />)}
                        {data.invoices.length === 0 && <p className="text-xs italic text-slate-400 ml-1">Aucune facture</p>}
                    </ScrollArea>
                </div>

                {/* Differences Section */}
                <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 ml-1">Différences / Ecarts</h3>
                    <ScrollArea className={data.differences.length > 3 ? "h-62.5" : ""}>
                        {data.differences.map(diff => <DifferenceDetailCard key={diff.id} diff={diff} />)}
                        {data.differences.length === 0 && <p className="text-xs italic text-slate-400 ml-1">Aucun écart</p>}
                    </ScrollArea>
                </div>

                {/* Receipts Section */}
                <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 ml-1">Bons de Commissions</h3>
                    <ScrollArea className={data.receipts.length > 3 ? "h-50" : ""}>
                        {data.receipts.map(rec => <ReceiptDetailCard key={rec.id} receipt={rec} />)}
                        {data.receipts.length === 0 && <p className="text-xs italic text-slate-400 ml-1">Aucun bon</p>}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}