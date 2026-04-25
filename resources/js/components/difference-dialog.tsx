import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Customer } from "@/types/customers";
import { Difference } from "@/types/difference";
import { InvoiceItem } from "@/types/invoice-item";
import { AlertCircle, Ship } from "lucide-react";
import { useMemo } from "react";
import { DifferenceRow } from "./difference-row";
import { Badge } from "./ui/badge";
import { Item } from "@/types/item";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InvoiceItem & { differences?: Difference[] };
    customers: Customer[];
    items: Item[];
}

export function DifferenceDialog({ open, onOpenChange, item, customers, items }: Props) {
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
            {/* تم تكبير الـ max-w إلى 2xl لضمان مساحة أفقية كافية */}
            <DialogContent className="max-w-350 w-[95vw] p-0 border border-slate-200 shadow-lg flex flex-col max-h-[90vh] overflow-hidden">
                <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100 shrink-0">
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
                                    <span className="text-[12px] font-bold tracking-wide uppercase">
                                        {item.boat?.name}
                                    </span>
                                </Badge>

                                <span>•</span>

                                <span>
                                    Initial: <strong>{item.unit_count} {item.unit}</strong>
                                </span>

                                <span>•</span>

                                <span>
                                    P.U: <strong className="text-blue-600">{item.unit_price} DH</strong>
                                </span>
                            </div>
                        </div>

                        <div
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 border transition-colors",
                                remainingCount <= 0
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-orange-50 text-orange-700 border-orange-200"
                            )}
                        >
                            {remainingCount <= 0 ? (
                                "TERMINÉ"
                            ) : (
                                `RESTE: ${remainingCount.toFixed(2)}`
                            )}

                            {remainingCount < 0 && (
                                <AlertCircle className="h-3.5 w-3.5" />
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-white">
                    <Table className="w-full table-fixed border-collapse">
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-20 backdrop-blur-sm shadow-sm">
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                                <TableHead className="w-[28%] text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 pl-6">
                                    Client
                                </TableHead>

                                <TableHead className="w-[28%] text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">
                                    Article
                                </TableHead>

                                <TableHead className="w-[12%] text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Quantité
                                </TableHead>

                                <TableHead className="w-[12%] text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Prix Réel
                                </TableHead>

                                <TableHead className="w-[14%] text-right pr-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Diff. (DH)
                                </TableHead>

                                <TableHead className="w-[6%]"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody key={differences.length}>
                            {remainingCount > 0 && (
                                <DifferenceRow
                                    isNew
                                    invoiceItemId={item.id}
                                    customers={customers}
                                    items={items}
                                    maxAvailable={remainingCount}
                                />
                            )}

                            {differences.map((diff) => {
                                return (
                                    <DifferenceRow
                                        key={`${item.id}-${diff.id}`}
                                        diff={diff}
                                        customers={customers}
                                        items={items}
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