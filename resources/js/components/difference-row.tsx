import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { useDifferenceRow } from '@/hooks/use-difference-row';
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customer';
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
    defaultCustomerId?: number;
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
    defaultCustomerId,
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
        defaultCustomerId,
    });

    const inputClass =
        "h-10 border-none bg-transparent text-center focus-visible:ring-0 focus-visible:bg-slate-100 dark:focus-visible:bg-neutral-800 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-neutral-100";

    return (
        <TableRow
            className={cn(
                "group transition-colors h-10 min-h-10 border-b border-slate-100 dark:border-neutral-800",
                isNew ? "bg-blue-50/30 border-t-2 border-blue-100 dark:bg-blue-950/40 dark:border-blue-900" : "hover:bg-slate-50/50 dark:hover:bg-neutral-900/40"
            )}
        >
            {/* عمود الكليان */}
            <TableCell
                className={cn(
                    "p-0 border-r w-[20%]",
                    isNew ? "border-blue-100/50 dark:border-blue-900/40" : "border-slate-100 dark:border-neutral-800"
                )}
            >
                <SearchSelect
                    value={data.customer_id}
                    options={customers}
                    // placeholder={isNew ? "Client..." : diff?.customer?.name || "Client..."}
                    placeholder="Client..."
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
                    className="border-none bg-transparent shadow-none w-full justify-between capitalize font-medium text-slate-900 dark:text-neutral-100"
                />
            </TableCell>

            {/* عمود السلعة (Article) */}
            <TableCell
                className={cn(
                    "p-0 border-r",
                    isNew ? "border-blue-100/50 dark:border-blue-900/40" : "border-slate-100 dark:border-neutral-800"
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
                    className="border-none bg-transparent shadow-none capitalize font-medium text-slate-900 dark:text-neutral-100"
                />
            </TableCell>

            {/* عمود الكمية */}
            <TableCell
                className={cn(
                    "p-0 border-r",
                    isNew ? "border-blue-100/50 dark:border-blue-900/40" : "border-slate-100 dark:border-neutral-800"
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
                    "p-0 border-r w-[25%]",
                    isNew ? "border-blue-100/50 dark:border-blue-900/40" : "border-slate-100 dark:border-neutral-800"
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
                    "text-right pr-6 font-bold w-[15%]",
                    isNew
                        ? "text-slate-300 italic text-xs dark:text-neutral-600"
                        : (() => {
                              const value = Number(diff?.total_diff);

                              if (value < 0) {
                                  {
                                      return "text-red-500 dark:text-red-400";
                                  }
                              }

                              if (value > 0) {
                                  {
                                      return "text-green-600 dark:text-green-400";
                                  }
                              }

                              {
                                  return "text-slate-600 dark:text-neutral-300";
                              }
                          })()
                )}
            >
                {isNew
                    ? "Auto"
                    : (Number(diff?.total_diff) > 0 ? "+" : "") +
                      Number(diff?.total_diff)}
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
                                isNew ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-neutral-500"
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
                                    ? "text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950/60"
                                    : "text-slate-400 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
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