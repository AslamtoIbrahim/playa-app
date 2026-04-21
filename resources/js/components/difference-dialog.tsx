import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customers';
import { Difference } from '@/types/difference';
import { InvoiceItem } from '@/types/invoice-item';
import { AlertCircle, Ship } from 'lucide-react';
import { useMemo } from 'react';
import { DifferenceRow } from './difference-row';
import { Badge } from "./ui/badge";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InvoiceItem & { differences?: Difference[] };
    customers: Customer[];
}

export function DifferenceDialog({ open, onOpenChange, item, customers }: Props) {
    // استخدام useMemo لتفادي الـ Dependency Warning وضمان استقرار الداتا
    const differences = useMemo((): Difference[] => {
        return item.differences || [];
    }, [item.differences]);

    const totalDistributed = useMemo((): number => {
        return differences.reduce((sum, d) => {
            return sum + Number(d.unit_count);
        }, 0);
    }, [differences]);

    const remainingCount = Number(item.unit_count) - totalDistributed;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border border-slate-200 shadow-lg">
                {/* Header بسيط بلون فاتح هادئ متناسق مع Shadcn */}
                <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-start justify-between pr-8">
                        <div className="space-y-1.5">
                            <DialogTitle className="text-xl font-semibold text-slate-900">
                                Répartition: {item.item?.name}
                            </DialogTitle>

                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm"
                                >
                                    <Ship className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-[11px] font-bold tracking-wide uppercase">
                                        {item.boat?.name}
                                    </span>
                                </Badge>
                                <span>•</span>
                                <span>Initial: <strong>{item.unit_count} {item.unit}</strong></span>
                            </div>
                        </div>

                        <div className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 border transition-colors",
                            remainingCount <= 0
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                        )}>
                            {remainingCount <= 0 ? "TERMINÉ" : `RESTE: ${remainingCount.toFixed(2)}`}
                            {remainingCount < 0 && <AlertCircle className="h-3.5 w-3.5" />}
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-0 max-h-[65vh] overflow-y-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                                <TableHead className="w-1/3 text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Client</TableHead>
                                <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Quantité</TableHead>
                                <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Prix Réel</TableHead>
                                <TableHead className="text-right pr-8 text-[10px] font-bold uppercase tracking-widest text-center text-slate-500">Diff. (DH)</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody key={differences.length}>
                            {remainingCount > 0 && (
                                <DifferenceRow
                                    isNew
                                    invoiceItemId={item.id}
                                    customers={customers}
                                    maxAvailable={remainingCount}
                                />
                            )}

                            {differences.map((diff) => {
                                return (
                                    <DifferenceRow
                                        key={`${item.id}-${diff.id}`}
                                        diff={diff}
                                        customers={customers}
                                        maxAvailable={remainingCount + Number(diff.unit_count)}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}