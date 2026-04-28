import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customers';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { SearchSelect } from './search-select';
import { useCommissionRow } from "@/hooks/use-commission-row";
import { ReceiptItem } from "@/types/receipt-item";

interface CommissionRowProps {
    beneficiaries: Customer[];
    invoiceItemId: number;
    sessionId: number;
    date: string;
    onSuccess?: () => void;
    // زدت هاد الـ prop باش ندوزو الداتا لي ديجا كاينة
    commission?: ReceiptItem;
}

export function CommissionRow({
    beneficiaries,
    invoiceItemId,
    sessionId,
    date,
    onSuccess,
    commission,
}: CommissionRowProps) {
    const {
        data,
        handleDataChange,
        loading,
        openCustomer,
        setOpenCustomer,
        handleKeyDown,
        submitSave,
        deleteCommission, // خاص هادي تكون عندك فـ الـ hook
    } = useCommissionRow({
        invoiceItemId,
        // إلا كاين commission، كنهزو منو الداتا، وإلا لا كنديرو default 1
        unitCount: commission ? Number(commission.unit_count) : 1,
        commission,
        sessionId,
        date,
        onSuccess,
    });

    const isExisting = !!commission;

    const inputClass =
        "h-10 border-none bg-transparent text-center focus-visible:ring-0 focus-visible:bg-slate-200/60 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (
        <TableRow
            className={cn(
                "group transition-colors h-10 min-h-10 border-t-2",
                isExisting
                    ? "bg-amber-50/20 border-amber-100"
                    : "bg-emerald-50/30 border-red-200"
            )}
        >
            {/* 1. Client / Bénéficiaire */}
            <TableCell className={cn(
                "p-0 border-r w-[25%]",
                isExisting ? "border-amber-100/50" : "border-emerald-100/50"
            )}>
                <SearchSelect
                    value={data.beneficiary_id}
                    options={beneficiaries}
                    placeholder="Bénéficiaire..."
                    open={openCustomer}
                    onOpenChange={setOpenCustomer}
                    onKeyDown={(e) => {
                        handleKeyDown(e, 'customer');
                    }}
                    onSelect={(id) => {
                        handleDataChange({ beneficiary_id: id.toString() });

                        setOpenCustomer(false);
                    }}
                    className="border-none bg-transparent shadow-none w-full justify-between capitalize font-medium text-amber-700"
                />
            </TableCell>

            {/* 2. Article (Read-only Input for Navigation) */}
            <TableCell
                className={cn(
                    "p-0 border-r w-[20%]",
                    isExisting ? "border-amber-100/50" : "border-emerald-100/50"
                )}
            >
                <Input
                    readOnly
                    value={isExisting ? "💰" : ""}
                    placeholder="---"
                    onKeyDown={(e) => {
                        handleKeyDown(e);
                    }}
                    className={cn(
                        inputClass,
                        "cursor-default caret-transparent focus:bg-slate-100/50 outline-none  text-xs tracking-widest ",
                    )}
                />
            </TableCell>

            {/* 3. Qté */}
            <TableCell className={cn(
                "p-0 border-r w-[15%]",
                isExisting ? "border-amber-100/50" : "border-emerald-100/50"
            )}>
                <Input
                    value={data.unit_count}
                    placeholder="Qté"
                    onChange={(e) => {
                        handleDataChange({ unit_count: e.target.value });
                    }}
                    onKeyDown={(e) => {
                        handleKeyDown(e);
                    }}
                    className={cn(inputClass, "font-semibold text-slate-700")}
                    type="number"
                />
            </TableCell>

            {/* 4. PR (Commission per unit) */}
            <TableCell className={cn(
                "p-0 border-r w-[15%]",
                isExisting ? "border-amber-100/50" : "border-emerald-100/50"
            )}>
                <Input
                    value={data.commission_per_unit}
                    placeholder="0.00"
                    onChange={(e) => {
                        handleDataChange({ commission_per_unit: e.target.value });
                    }}
                    onKeyDown={(e) => {
                        handleKeyDown(e);
                    }}
                    className={cn(inputClass, "text-amber-600 font-bold")}
                    type="number"
                />
            </TableCell>

            {/* 5. Diff (Total) */}
            <TableCell className={cn(
                "text-center font-black w-[20%]",
                isExisting ? "text-amber-700 bg-amber-100/20" : "text-amber-600 bg-red-50/20"
            )}>
                {(() => {
                    const total = Number(data.unit_count) * Number(data.commission_per_unit);

                    if (isNaN(total) || total === 0) {
                        {
                            return "0.00";
                        }
                    }

                    return `-${total}`;
                })()}
            </TableCell>

            {/* 6. Action */}
            <TableCell className="p-0 text-center w-10">
                <div className="flex justify-center h-10 items-center">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                        <>
                            {isExisting ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        {
                                            deleteCommission();
                                        }
                                    }}
                                    className="h-10 w-full rounded-none opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        {
                                            submitSave();
                                        }
                                    }}
                                    className="h-10 w-full rounded-none opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}