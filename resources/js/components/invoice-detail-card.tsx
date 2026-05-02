// components/sessions/invoice-detail-card.tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Invoice } from "@/types/invoice";
import { Hash, Package } from "lucide-react";

export function InvoiceDetailCard({ invoice }: { invoice: Invoice }) {
    return (
        <Card className="mb-3 overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                            <Hash className="h-4 w-4 text-slate-400" />
                            {invoice.invoice_number}
                            <Badge variant="secondary" className="text-[10px]">
                                {invoice.billable?.name || 'Client Inconnu'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <Package className="h-3.5 w-3.5" /> {invoice.boxes} Caisses
                            </span>
                            <span>{invoice.weight ? `${invoice.weight} Kg` : '-- Kg'}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-lg text-primary">
                            {invoice.amount.toLocaleString()} MAD
                        </div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="capitalize">
                            {invoice.status}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}