import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Customer } from "@/types/customers";
import { Difference } from "@/types/difference";
import { InvoiceItem } from "@/types/invoice-item";
import { Item } from "@/types/item";
import { AlertCircle, CircleDollarSign, Dot, Ship } from "lucide-react"; // زدت Percent icon
import { useMemo, useState } from "react"; // زدت useState
import { CommissionRow } from "./commission-row"; // import ديالنا الجديد
import { DifferenceRow } from "./difference-row";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InvoiceItem;
    customers: Customer[];
    items: Item[];
    sessionId: number; // ضرورية للكوميسيون
    date: string;      // ضرورية للكوميسيون
}

export function DifferenceDialog({ open, onOpenChange, item, customers, items, sessionId, date }: Props) {
    const [showCommission, setShowCommission] = useState(false);

    const differences = useMemo((): Difference[] => {
        {
            return item.differences || [];
        }
    }, [item.differences]);

    const totalDistributed = useMemo((): number => {
        {
            return differences.reduce((sum, d) => {
                return sum + Number(d.unit_count);
            }, 0);
        }
    }, [differences]);

    const remainingCount = Number(item.unit_count) - totalDistributed;

    const totalDiffSum = useMemo((): number => {
        {
            const diffsSum = differences.reduce((sum, d) => {
                {
                    return sum + (Number(d.total_diff) || 0);
                }
            }, 0);

            const commissionsSum = (item.receipt_items || [])
                .filter(ri => ri.type === 'commission')
                .reduce((sum, c) => {
                    {
                        return sum + (Number(c.unit_count) * Number(c.real_price) || 0);
                    }
                }, 0);

            return diffsSum - commissionsSum;
        }
    }, [differences, item.receipt_items]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 border max-w-500 w-[95vw] border-slate-200 shadow-lg flex flex-col gap-0 max-h-[90vh] overflow-hidden">
                <DialogHeader className="p-6 pb-2 bg-slate-50/50 border-b border-slate-300 shrink-0">
                    <div className="flex flex-col items-start justify-between gap-4 pr-8">
                        <div className="flex items-center justify-between w-full">
                            <DialogTitle className="text-xl capitalize font-semibold text-slate-900">
                                <span className="text-slate-500">Répartition</span>: {item.item?.name}
                            </DialogTitle>

                            <div className="flex items-center gap-2">

                                <div className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 border transition-colors",
                                    remainingCount <= 0
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-orange-50 text-orange-700 border-orange-200"
                                )}>
                                    {remainingCount <= 0 ? "TERMINÉ" : `RESTE: ${remainingCount}`}
                                    {remainingCount < 0 && <AlertCircle className="h-3.5 w-3.5" />}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full">
                            {/* ... (Badge and info section remains same) */}
                            <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border-slate-200 shadow-sm">
                                <Ship className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-[12px] font-bold tracking-wide uppercase">{item.boat?.name}</span>
                            </Badge>

                            {/* زر لإظهار سطر الكوميسيون */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    {
                                        setShowCommission(!showCommission);
                                    }
                                }}
                                className={cn(
                                    "h-8 text-xs gap-1.5 self-end",
                                    showCommission ? "bg-white text-red-500 border-emerald-200" : ""
                                )}
                            >
                                <CircleDollarSign className="h-3.5 w-3.5 text-amber-600" />

                            </Button>
                        </div>

                        <div className="flex items-center justify-between w-full text-sm text-slate-500">
                            <span>Quantité: <strong className="bg-slate-50 px-2 py-0.5 rounded text-sm">{item.unit_count} {item.unit}</strong></span>
                            <Dot />
                            <span>P.U: <strong className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-sm">{item.unit_price} DH</strong></span>
                            <Dot />
                            <span className="flex items-center gap-1">
                                Total Diff:
                                <strong className={cn(
                                    "px-2 py-0.5 rounded text-sm",
                                    totalDiffSum >= 0 ? "text-green-600 bg-green-50" : "text-red-700 bg-red-50"
                                )}>
                                    {totalDiffSum} DH
                                </strong>
                            </span>
                        </div>

                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                    <Table className="w-full table-fixed border-collapse">
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-20 backdrop-blur-sm shadow-sm">
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                                <TableHead className="w-[22%] text-[10px] font-bold uppercase py-4 pl-6 text-slate-500">Client / Bénéf.</TableHead>
                                <TableHead className="w-[18%] text-center text-[10px] font-bold uppercase py-4 text-slate-500">Article</TableHead>
                                <TableHead className="w-[12%] text-center text-[10px] font-bold uppercase text-slate-500">Qté</TableHead>
                                <TableHead className="w-[12%] text-center text-[10px] font-bold uppercase text-slate-500">P.R / P.Comm</TableHead>
                                <TableHead className="w-[14%] text-center text-[10px] font-bold uppercase text-slate-500">Diff Total</TableHead>
                                <TableHead className="w-[5%]"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody key={differences.length}>
                            {/* سطر الكوميسيون الجديد (كيظهر غير إلا بركنا على الزر) */}
                            {showCommission && (
                                <CommissionRow
                                    beneficiaries={customers}
                                    invoiceItemId={item.id}
                                    sessionId={sessionId}
                                    date={date}
                                    onSuccess={() => {
                                        {
                                            setShowCommission(false);
                                        }
                                    }}
                                />
                            )}

                            {item.receipt_items?.filter(ri => ri.type === 'commission').map((comm) => (
                                <CommissionRow
                                    key={`comm-${comm.id}`}
                                    commission={comm} // هنا كندوزو الـ Object كامل
                                    beneficiaries={customers}
                                    invoiceItemId={item.id}
                                    sessionId={sessionId}
                                    date={date}
                                />
                            ))}

                            {remainingCount > 0 && (
                                <DifferenceRow
                                    isNew
                                    invoiceItemId={item.id}
                                    customers={customers}
                                    items={items}
                                    maxAvailable={remainingCount}
                                    defaultCustomerId={item.boat?.owner_id}
                                />
                            )}

                            {differences.map((diff) => {
                                {
                                    return (
                                        <DifferenceRow
                                            key={`${item.id}-${diff.id}`}
                                            diff={diff}
                                            customers={customers}
                                            items={items}
                                            maxAvailable={remainingCount + Number(diff.unit_count)}
                                            defaultCustomerId={diff.customer_id}
                                        />
                                    );
                                }
                            })}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}