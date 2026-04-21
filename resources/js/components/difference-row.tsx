import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { useDifferenceRow } from '@/hooks/use-difference-row';
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customers';
import { Difference } from '@/types/difference';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { SearchSelect } from './search-select';

interface RowProps {
    diff?: Difference;
    customers: Customer[];
    maxAvailable: number;
    isNew?: boolean;
    invoiceItemId?: number;
    onSuccess?: (newDiff: Difference) => void;
    onDelete?: (id: number) => void;
}

export function DifferenceRow({
    diff,
    customers,
    maxAvailable,
    isNew,
    invoiceItemId,
    onSuccess,
    onDelete
}: RowProps) {
    const {
        localData,
        setLocalData,
        loading,
        openCustomer,
        setOpenCustomer,
        handleUpdate,
        handleDelete,
        handleKeyDown,
        countRef,
        priceRef
    } = useDifferenceRow({
        diff,
        maxAvailable,
        isNew,
        invoiceItemId,
        onSuccess,
        onDelete
    });

    const inputClass = "h-10 border-none bg-transparent text-center focus-visible:ring-0 focus-visible:bg-slate-100 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (
        <TableRow className={cn(
            "group transition-colors",
            isNew ? "bg-blue-50/30 border-t-2 border-blue-100" : "hover:bg-slate-50/50"
        )}>
            <TableCell
                className={cn("p-0 border-r", isNew ? "border-blue-100/50" : "border-slate-100")}
                onKeyDown={(e) => {
                    handleKeyDown(e, 'customer');
                }}
                data-new-row={isNew ? "true" : "false"}
            >
                <SearchSelect
                    value={localData.customer_id}
                    options={customers}
                    placeholder={isNew ? "Sélectionner client..." : (diff?.customer?.name || "Client...")}
                    open={openCustomer}
                    onOpenChange={setOpenCustomer}
                    onSelect={(id) => {
                        const newId = id.toString();

                        setLocalData(prev => ({ ...prev, customer_id: newId }));
                        setOpenCustomer(false);

                        if (isNew) {
                            const currentCount = countRef.current?.value || '';
                            const currentPrice = priceRef.current?.value || '';

                            if (currentCount !== '' && currentPrice !== '') {
                                handleUpdate({
                                    customer_id: newId,
                                    unit_count: currentCount,
                                    real_price: currentPrice
                                }, true);

                                return;
                            }

                            setTimeout(() => {
                                countRef.current?.focus();
                                countRef.current?.select();
                            }, 10);
                        } else {
                            handleUpdate({ customer_id: newId });
                        }
                    }}
                    className="border-none bg-transparent shadow-none w-full justify-start font-medium"
                />
            </TableCell>

            <TableCell className={cn("p-0 border-r", isNew ? "border-blue-100/50" : "border-slate-100")}>
                <Input
                    ref={countRef}
                    value={localData.unit_count}
                    placeholder={isNew ? "0.00" : ""}
                    onChange={(e) => {
                        setLocalData(prev => ({ ...prev, unit_count: e.target.value }));
                    }}
                    onBlur={() => {
                        if (!isNew && diff) {
                            handleUpdate();
                        }
                    }}
                    onKeyDown={(e) => {
                        handleKeyDown(e, 'count');
                    }}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            <TableCell className={cn("p-0 border-r", isNew ? "border-blue-100/50" : "border-slate-100")}>
                <Input
                    ref={priceRef}
                    value={localData.real_price}
                    placeholder={isNew ? "0.00" : ""}
                    onChange={(e) => {
                        setLocalData(prev => ({ ...prev, real_price: e.target.value }));
                    }}
                    onBlur={() => {
                        if (!isNew && diff) {
                            handleUpdate();
                        }
                    }}
                    onKeyDown={(e) => {
                        handleKeyDown(e, 'price');
                    }}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            <TableCell className={cn(
                "text-right pr-6 font-bold",
                isNew ? "text-slate-300 italic text-xs" : (() => {
                    const value = Number(diff?.total_diff);

                    if (value < 0) {
                        return "text-red-500";
                    }

                    if (value > 0) {
                        return "text-green-600";
                    }

                    return "text-slate-600";
                })()
            )}>
                {isNew ? "Auto" : (Number(diff?.total_diff) > 0 ? '+' : '') + Number(diff?.total_diff).toLocaleString()}
            </TableCell>

            <TableCell className="p-0 text-center">
                <div className={cn("flex justify-center h-10 items-center", !isNew && "opacity-0 group-hover:opacity-100")}>
                    {loading ? (
                        <Loader2 className={cn("h-4 w-4 animate-spin", isNew ? "text-blue-600" : "text-slate-400")} />
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (isNew) {
                                    handleUpdate({}, true);
                                } else {
                                    handleDelete();
                                }
                            }}
                            className={cn(
                                "h-10 w-full rounded-none",
                                isNew ? "text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:text-red-600"
                            )}
                        >
                            {isNew ? <Plus className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}