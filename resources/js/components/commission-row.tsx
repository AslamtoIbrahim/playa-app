import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { useCommissionRow } from '@/hooks/use-commission-row';
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customer';
import { ReceiptItem } from '@/types/receipt-item';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { SearchSelect } from './search-select';

interface CommissionRowProps {
    beneficiaries: Customer[];
    invoiceItemId: number;
    sessionZoneId: number;
    date: string;
    onSuccess?: () => void;
    // زدت هاد الـ prop باش ندوزو الداتا لي ديجا كاينة
    commission?: ReceiptItem;
}

export function CommissionRow({
    beneficiaries,
    invoiceItemId,
    sessionZoneId,
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
        sessionZoneId,
        date,
        onSuccess,
    });

    const isExisting = !!commission;

    const inputClass =
        'h-10 border-none bg-transparent text-center focus-visible:ring-0 focus-visible:bg-slate-200/60 dark:focus-visible:bg-neutral-800 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-neutral-100';

    return (
        <TableRow
            className={cn(
                'group h-10 min-h-10 border-t-2 transition-colors border-slate-100 dark:border-neutral-800',
                isExisting
                    ? 'border-amber-100 bg-amber-50/20 dark:border-amber-900/60 dark:bg-amber-950/20'
                    : 'border-red-200 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/20',
            )}
        >
            {/* 1. Client / Bénéficiaire */}
            <TableCell
                className={cn(
                    'w-[25%] border-r p-0',
                    isExisting
                        ? 'border-amber-100/50 dark:border-amber-900/40'
                        : 'border-emerald-100/50 dark:border-emerald-900/40',
                )}
            >
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
                    className="w-full justify-between border-none bg-transparent font-medium text-amber-700 capitalize shadow-none dark:text-amber-400"
                />
            </TableCell>

            {/* 2. Article (Read-only Input for Navigation) */}
            <TableCell
                className={cn(
                    'w-[20%] border-r p-0',
                    isExisting
                        ? 'border-amber-100/50 dark:border-amber-900/40'
                        : 'border-emerald-100/50 dark:border-emerald-900/40',
                )}
            >
                <Input
                    readOnly
                    value={isExisting ? '💰' : ''}
                    placeholder="---"
                    onKeyDown={(e) => {
                        handleKeyDown(e);
                    }}
                    className={cn(
                        inputClass,
                        'cursor-default text-xs tracking-widest caret-transparent outline-none focus:bg-slate-100/50 dark:focus:bg-neutral-800',
                    )}
                />
            </TableCell>

            {/* 3. Qté */}
            <TableCell
                className={cn(
                    'w-[15%] border-r p-0',
                    isExisting
                        ? 'border-amber-100/50 dark:border-amber-900/40'
                        : 'border-emerald-100/50 dark:border-emerald-900/40',
                )}
            >
                <Input
                    value={data.unit_count}
                    placeholder="Qté"
                    onChange={(e) => {
                        handleDataChange({ unit_count: e.target.value });
                    }}
                    onKeyDown={(e) => {
                        handleKeyDown(e);
                    }}
                    className={cn(inputClass, 'font-semibold text-slate-700 dark:text-neutral-300')}
                    type="number"
                />
            </TableCell>

            {/* 4. PR (Commission per unit) */}
            <TableCell
                className={cn(
                    'w-[15%] border-r p-0',
                    isExisting
                        ? 'border-amber-100/50 dark:border-amber-900/40'
                        : 'border-emerald-100/50 dark:border-emerald-900/40',
                )}
            >
                <Input
                    value={data.commission_per_unit}
                    placeholder="0.00"
                    onChange={(e) => {
                        handleDataChange({
                            commission_per_unit: e.target.value,
                        });
                    }}
                    onKeyDown={(e) => {
                        handleKeyDown(e);
                    }}
                    className={cn(inputClass, 'font-bold text-amber-600 dark:text-amber-400')}
                    type="number"
                />
            </TableCell>

            {/* 5. Diff (Total) */}
            <TableCell
                className={cn(
                    'w-[20%] text-center font-black',
                    isExisting
                        ? 'bg-amber-100/20 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-red-50/20 text-amber-600 dark:bg-red-950/40 dark:text-amber-400',
                )}
            >
                {(() => {
                    const total =
                        Number(data.unit_count) *
                        Number(data.commission_per_unit);

                    if (isNaN(total) || total === 0) {
                        {
                            return '0.00';
                        }
                    }

                    return `-${total}`;
                })()}
            </TableCell>

            {/* 6. Action */}
            <TableCell className="w-10 p-0 text-center">
                <div className="flex h-10 items-center justify-center">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-neutral-500" />
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
                                    className="h-10 w-full rounded-none text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
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
                                    className="h-10 w-full rounded-none text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-600 dark:text-neutral-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
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
