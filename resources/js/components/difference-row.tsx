import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { useDifferenceRow } from '@/hooks/use-difference-row';
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customers';
import { Difference } from '@/types/difference';
import { Item } from '@/types/item';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { SearchSelect } from './search-select';

interface RowProps {
    diff?: Difference;
    customers: Customer[];
    items: Item[];
    maxAvailable: number;
    isNew?: boolean;
    invoiceItemId?: number;
    onSuccess?: (newDiff: Difference) => void;
    onDelete?: (id: number) => void;
}

export function DifferenceRow({
    diff,
    customers,
    items,
    maxAvailable,
    isNew,
    invoiceItemId,
    onSuccess,
    onDelete,
}: RowProps) {
    const {
        data,
        handleDataChange,
        loading,
        openCustomer,
        setOpenCustomer,
        openItem,
        setOpenItem,
        handleDelete,
        handleKeyDown,
        submitSave,
    } = useDifferenceRow({
        diff,
        maxAvailable,
        isNew,
        invoiceItemId,
        onSuccess,
        onDelete,
    });

    const inputClass =
        "h-10 border-none bg-transparent text-center focus-visible:ring-0 focus-visible:bg-slate-100 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (
        <TableRow
            className={cn(
                "group transition-colors h-10 min-h-10",
                isNew ? "bg-blue-50/30 border-t-2 border-blue-100" : "hover:bg-slate-50/50"
            )}
        >
            {/* عمود الكليان */}
            <TableCell
                className={cn(
                    "p-0 border-r w-[25%]",
                    isNew ? "border-blue-100/50" : "border-slate-100"
                )}
            >
                <SearchSelect
                    value={data.customer_id}
                    options={customers}
                    placeholder={isNew ? "Client..." : diff?.customer?.name || "Client..."}
                    open={openCustomer}
                    onOpenChange={setOpenCustomer}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e, "customer");
                        }
                    }}
                    onSelect={(id) => {
                        {
                            handleDataChange({ customer_id: id.toString() });

                            setOpenCustomer(false);

                            if (!isNew) {
                                {
                                    submitSave({ ...data, customer_id: id.toString() });
                                }
                            }
                        }
                    }}
                    className="border-none bg-transparent shadow-none w-full justify-start font-medium"
                />
            </TableCell>

            {/* عمود السلعة (Article) */}
            <TableCell
                className={cn(
                    "p-0 border-r w-[25%]",
                    isNew ? "border-blue-100/50" : "border-slate-100"
                )}
            >
                <SearchSelect
                    value={data.item_id}
                    options={items}
                    placeholder={isNew ? "Article..." : diff?.item?.name || "Article..."}
                    open={openItem}
                    onOpenChange={setOpenItem}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e, "item");
                        }
                    }}
                    onSelect={(id) => {
                        {
                            handleDataChange({ item_id: id.toString() });

                            setOpenItem(false);

                            if (!isNew) {
                                {
                                    submitSave({ ...data, item_id: id.toString() });
                                }
                            }
                        }
                    }}
                    className="border-none bg-transparent shadow-none w-full justify-start font-medium"
                />
            </TableCell>

            {/* عمود الكمية */}
            <TableCell
                className={cn(
                    "p-0 border-r",
                    isNew ? "border-blue-100/50" : "border-slate-100"
                )}
            >
                <Input
                    value={data.unit_count}
                    placeholder="0"
                    onChange={(e) => {
                        {
                            handleDataChange({ unit_count: e.target.value });
                        }
                    }}
                    onBlur={() => {
                        {
                            if (!isNew && diff) {
                                {
                                    submitSave();
                                }
                            }
                        }
                    }}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e);
                        }
                    }}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            {/* عمود الثمن */}
            <TableCell
                className={cn(
                    "p-0 border-r",
                    isNew ? "border-blue-100/50" : "border-slate-100"
                )}
            >
                <Input
                    value={data.real_price}
                    placeholder="0.00"
                    onChange={(e) => {
                        {
                            handleDataChange({ real_price: e.target.value });
                        }
                    }}
                    onBlur={() => {
                        {
                            if (!isNew && diff) {
                                {
                                    submitSave();
                                }
                            }
                        }
                    }}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e);
                        }
                    }}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            {/* عمود الفرق */}
            <TableCell
                className={cn(
                    "text-right pr-6 font-bold",
                    isNew
                        ? "text-slate-300 italic text-xs"
                        : (() => {
                              const value = Number(diff?.total_diff);

                              if (value < 0) {
                                  {
                                      return "text-red-500";
                                  }
                              }

                              if (value > 0) {
                                  {
                                      return "text-green-600";
                                  }
                              }

                              {
                                  return "text-slate-600";
                              }
                          })()
                )}
            >
                {isNew
                    ? "Auto"
                    : (Number(diff?.total_diff) > 0 ? "+" : "") +
                      Number(diff?.total_diff).toLocaleString()}
            </TableCell>

            {/* عمود الأكشن */}
            <TableCell className="p-0 text-center w-15 min-w-15">
                <div
                    className={cn(
                        "flex justify-center h-10 items-center",
                        !isNew && "opacity-0 group-hover:opacity-100"
                    )}
                >
                    {loading ? (
                        <Loader2
                            className={cn(
                                "h-4 w-4 animate-spin",
                                isNew ? "text-blue-600" : "text-slate-400"
                            )}
                        />
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                {
                                    isNew ? submitSave() : handleDelete();
                                }
                            }}
                            className={cn(
                                "h-10 w-full rounded-none",
                                isNew
                                    ? "text-blue-600 hover:bg-blue-100"
                                    : "text-slate-400 hover:text-red-600"
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