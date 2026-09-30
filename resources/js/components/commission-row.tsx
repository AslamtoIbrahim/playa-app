import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { useCommissionRow } from '@/hooks/use-commission-row';
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customer';
import { ReceiptItem } from '@/types/receipt-item';
import type { CommissionDraft } from '@/hooks/use-commission-row';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import MissingCustomerCompanyPopup from './missing-customer-company-popup';
import { SearchSelect } from './search-select';

interface CommissionRowProps {
    beneficiaries: Customer[];
    boatId: number;
    sessionZoneId: number;
    date: string;
    onSuccess?: () => void;
    /** Saved commission, when the row is rendered outside the dialog. */
    commission?: ReceiptItem;
    /** Starting values of the line (draft mode). */
    initialDraft?: CommissionDraft;
    /**
     * Draft mode: the line sends no request, every change is pushed up to the
     * dialog, which saves all the lines at once.
     */
    onDraftChange?: (data: CommissionDraft) => void;
    /** Adds a new empty line to the dialog (draft mode). */
    onAddLine?: () => void;
    /** Saved line: highlighted in the grid and deletable. */
    isPersisted?: boolean;
    /** The dialog is deleting this line: show a spinner and block the buttons. */
    isDeleting?: boolean;
    /** Asks the dialog to delete a saved line (draft mode). */
    onDeleteRow?: () => void;
}

export function CommissionRow({
    beneficiaries,
    boatId,
    sessionZoneId,
    date,
    onSuccess,
    commission,
    initialDraft,
    onDraftChange,
    onAddLine,
    isPersisted,
    isDeleting = false,
    onDeleteRow,
}: CommissionRowProps) {
    const {
        data,
        handleDataChange,
        loading,
        openCustomer,
        setOpenCustomer,
        handleKeyDown,
        submitSave,
        deleteCommission,
    } = useCommissionRow({
        boatId,
        unitCount: commission ? Number(commission.unit_count) : 1,
        commission,
        sessionZoneId,
        date,
        onSuccess,
        initialDraft,
        onDraftChange,
    });

    const isExisting = !!commission;

    /** In draft mode the line is a new line of the report. */
    const isDraft = onDraftChange !== undefined;

    /** Saved line: shown differently from a new one. */
    const isSaved = isPersisted === true;

    /** A line that exists in the database, and can therefore be deleted. */
    const canDelete = isDraft ? isSaved : isExisting;

    /** Nothing is running: the buttons can be used. */
    const isIdle = !loading && !isDeleting;

    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

    const inputClass =
        'h-10 border-none bg-transparent text-center focus-visible:ring-0 focus-visible:bg-slate-200/60 dark:focus-visible:bg-neutral-800 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-neutral-100';

    return (
        <TableRow
            className={cn(
                'group h-10 min-h-10 border-t-2 border-slate-100 transition-colors dark:border-neutral-800',
                isExisting || isSaved
                    ? 'border-amber-100 bg-amber-50/20 dark:border-amber-900/60 dark:bg-amber-950/20'
                    : 'border-red-200 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/20',
            )}
        >
            {/* 1. Client / Bénéficiaire */}
            <TableCell
                className={cn(
                    'w-[25%] border-r p-0',
                    isExisting || isSaved
                        ? 'border-amber-100/50 dark:border-amber-900/40'
                        : 'border-emerald-100/50 dark:border-emerald-900/40',
                )}
            >
                <SearchSelect
                    value={data.beneficiary_id}
                    options={beneficiaries}
                    placeholder="Bénéficiaire..."
                    renderNoMatchAction={(search) => (
                        <MissingCustomerCompanyPopup initialName={search} />
                    )}
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

            {/* 2. Article (read only, kept for keyboard navigation) */}
            <TableCell
                className={cn(
                    'w-[20%] border-r p-0',
                    isExisting || isSaved
                        ? 'border-amber-100/50 dark:border-amber-900/40'
                        : 'border-emerald-100/50 dark:border-emerald-900/40',
                )}
            >
                <Input
                    readOnly
                    value={isExisting || isSaved ? '💰' : ''}
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

            {/* 3. Quantity */}
            <TableCell
                className={cn(
                    'w-[15%] border-r p-0',
                    isExisting || isSaved
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
                    className={cn(
                        inputClass,
                        'font-semibold text-slate-700 dark:text-neutral-300',
                    )}
                    type="number"
                />
            </TableCell>

            {/* 4. Commission price per unit */}
            <TableCell
                className={cn(
                    'w-[15%] border-r p-0',
                    isExisting || isSaved
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
                    className={cn(
                        inputClass,
                        'font-bold text-amber-600 dark:text-amber-400',
                    )}
                    type="number"
                />
            </TableCell>

            {/* 5. Total */}
            <TableCell
                className={cn(
                    'w-[20%] text-center font-black',
                    isExisting || isSaved
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
                    {isIdle ? (
                        canDelete && isDraft ? (
                            <AlertDialog
                                open={isDeleteOpen}
                                onOpenChange={setIsDeleteOpen}
                            >
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-full rounded-none text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                        title="Supprimer la commission"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                            <Trash2 className="h-5 w-5" />
                                            Supprimer cette commission ?
                                        </AlertDialogTitle>

                                        <AlertDialogDescription>
                                            Le bénéficiaire et le propriétaire
                                            du bateau seront tous les deux
                                            débités. Cette action est
                                            définitive.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Annuler
                                        </AlertDialogCancel>

                                        <AlertDialogAction
                                            onClick={(event) => {
                                                event.preventDefault();

                                                setIsDeleteOpen(false);

                                                onDeleteRow?.();
                                            }}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Supprimer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : canDelete ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    deleteCommission();
                                }}
                                className="h-10 w-full rounded-none text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                title="Supprimer la commission"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        ) : isDraft ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    onAddLine?.();
                                }}
                                className="h-10 w-full rounded-none text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:text-neutral-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                                title="Ajouter une ligne"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    submitSave();
                                }}
                                className="h-10 w-full rounded-none text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-600 dark:text-neutral-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )
                    ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-neutral-500" />
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}
