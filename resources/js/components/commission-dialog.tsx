import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { isCommissionDraftValid } from '@/hooks/use-commission-row';
import {
    destroy,
    storeCommission,
    updateCommission,
} from '@/routes/receipts/items';
import type { CommissionDraft } from '@/hooks/use-commission-row';
import type { Page } from '@inertiajs/core';
import { Customer } from '@/types/customer';
import { router } from '@inertiajs/react';
import { CircleDollarSign, Loader2, Plus, Ship } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CommissionRow } from './commission-row';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * A commission already saved, sent back by the report so it can be edited or
 * deleted instead of being created a second time.
 */
export interface ExistingCommission {
    id: number;
    /** Receipt holding the line. Required by the update and delete routes. */
    receipt_id: number;
    beneficiary_id: number;
    beneficiary_name?: string | null;
    unit_count: number;
    commission_per_unit: number;
}

/**
 * One line of the dialog: a new commission, or a saved one being edited.
 */
interface DraftRow extends CommissionDraft {
    /** Stable key: forces the line to be rebuilt when its values are reset. */
    rowKey: string;
    /** Set for a saved commission: the line is updated instead of created. */
    commission_id?: number;
    /** Receipt holding the line, required by the update and delete routes. */
    receipt_id?: number;
    /** The line exists in the database: it shows a delete button. */
    isPersisted?: boolean;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    boatId: number;
    sessionZoneId: number;
    date: string;
    beneficiaries: Customer[];
    boatName?: string;
    ownerName?: string;
    /** The boat owner is a company: no negative receipt can be written. */
    ownerIsCompany?: boolean;
    /** Commissions already saved for this boat. */
    commissions?: ExistingCommission[];
}

/** A line is empty while the user has not typed anything in it. */
function isDraftRowEmpty(row: DraftRow): boolean {
    return (
        row.beneficiary_id.trim() === '' &&
        row.commission_per_unit.trim() === ''
    );
}

/** Flash messages shared with the frontend by the backend middleware. */
interface FlashMessage {
    success?: string | null;
    error?: string | null;
}

/** Builds the "saved" message from the created and updated line counts. */
function buildSaveMessage(created: number, updated: number): string {
    const parts: string[] = [];

    if (created > 0) {
        parts.push(
            created === 1
                ? 'Commission enregistrée'
                : `${created} commissions enregistrées`,
        );
    }

    if (updated > 0) {
        parts.push(
            updated === 1
                ? 'Commission mise à jour'
                : `${updated} commissions mises à jour`,
        );
    }

    return `${parts.join(' · ')} ✅`;
}

/**
 * Module counter: gives every draft line a unique id so React rebuilds the line
 * when its values are reset. The dialog is remounted on each open (the page
 * changes its `key`), so the counter does not need to be reset.
 */
let commissionRowCounter = 0;

export function CommissionDialog({
    open,
    onOpenChange,
    boatId,
    sessionZoneId,
    date,
    beneficiaries,
    boatName,
    ownerName,
    ownerIsCompany,
    commissions = [],
}: Props) {
    /**
     * The dialog is remounted on every open (the page changes its `key`), so
     * building the lines once from the saved commissions is enough.
     */
    const createDraftRow = (): DraftRow => {
        commissionRowCounter += 1;

        return {
            rowKey: `commission-${commissionRowCounter}`,
            beneficiary_id: '',
            commission_per_unit: '',
            unit_count: '1',
        };
    };

    /** One line per saved commission, plus an empty line to add a new one. */
    const createInitialDrafts = (): DraftRow[] => {
        const saved = commissions.map((commission): DraftRow => {
            commissionRowCounter += 1;

            return {
                rowKey: `commission-${commissionRowCounter}`,
                commission_id: commission.id,
                receipt_id: commission.receipt_id,
                isPersisted: true,
                beneficiary_id: String(commission.beneficiary_id ?? ''),
                commission_per_unit: String(commission.commission_per_unit),
                unit_count: String(commission.unit_count),
            };
        });

        return [...saved, createDraftRow()];
    };

    const [drafts, setDrafts] = useState<DraftRow[]>(createInitialDrafts);
    const [saving, setSaving] = useState<boolean>(false);
    const [deletingRowKey, setDeletingRowKey] = useState<string | null>(null);

    const handleDraftChange = (rowKey: string, data: CommissionDraft): void => {
        setDrafts((prev) => {
            return prev.map((row) => {
                return row.rowKey === rowKey ? { ...row, ...data } : row;
            });
        });
    };

    const handleAddRow = (): void => {
        setDrafts((prev) => {
            return [...prev, createDraftRow()];
        });
    };

    const total = drafts.reduce((sum, row) => {
        return sum + Number(row.unit_count) * Number(row.commission_per_unit);
    }, 0);

    /** Removes a line and keeps one empty line at the bottom of the grid. */
    const removeDraftRow = (rowKey: string): void => {
        setDrafts((prev) => {
            const remaining = prev.filter((row) => row.rowKey !== rowKey);
            const hasEmptyRow = remaining.some(isDraftRowEmpty);

            return hasEmptyRow ? remaining : [...remaining, createDraftRow()];
        });
    };

    /**
     * Deletes a line: a new one is only removed from the grid, a saved one is
     * deleted for good on the server (both legs of the commission).
     */
    const handleDeleteRow = (row: DraftRow): void => {
        if (saving || deletingRowKey !== null) {
            return;
        }

        if (row.commission_id === undefined || row.receipt_id === undefined) {
            removeDraftRow(row.rowKey);

            return;
        }

        setDeletingRowKey(row.rowKey);

        router.delete(destroy([row.receipt_id, row.commission_id]), {
            preserveScroll: true,
            preserveState: true,

            onSuccess: (): void => {
                setDeletingRowKey(null);
                removeDraftRow(row.rowKey);

                toast.success('Commission supprimée.');

                // The report must not show the deleted commission any more.
                router.reload();
            },

            onError: (errors): void => {
                setDeletingRowKey(null);

                const firstError = Object.values(errors)[0];

                toast.error(
                    (typeof firstError === 'string' ? firstError : null) ??
                        "La commission n'a pas pu être supprimée.",
                );
            },
        });
    };

    /**
     * Saves the lines one after the other: `router` returns no promise, so we
     * chain the next call from `onSuccess` and close the dialog only once the
     * last line is done.
     *
     * Empty lines are skipped: the grid always ends with one and it must not
     * block the save. A line holding values but missing some of them is still
     * refused, otherwise a half filled commission would be created silently.
     */
    const handleSave = (): void => {
        if (saving) {
            return;
        }

        const rowsToSave = drafts.filter((row) => !isDraftRowEmpty(row));

        if (rowsToSave.length === 0) {
            toast.info('Renseignez au moins une commission.');

            return;
        }

        // A saved line emptied by mistake is not saved as "empty": it would
        // silently keep its old values. The user has to delete it on purpose.
        const emptiedSavedRow = drafts.find((row) => {
            return row.commission_id !== undefined && isDraftRowEmpty(row);
        });

        if (emptiedSavedRow) {
            toast.error(
                'Une commission enregistrée ne peut pas être vidée : utilisez la poubelle pour la supprimer.',
            );

            return;
        }

        const hasInvalidRow = rowsToSave.some((row) => {
            return !isCommissionDraftValid(row);
        });

        if (hasInvalidRow) {
            toast.error(
                'Chaque ligne doit avoir un bénéficiaire, une quantité et un prix de commission.',
            );

            return;
        }

        setSaving(true);

        const saveRow = (index: number): void => {
            if (index >= rowsToSave.length) {
                const updatedCount = rowsToSave.filter((row) => {
                    return row.commission_id !== undefined;
                }).length;
                const createdCount = rowsToSave.length - updatedCount;

                toast.success(buildSaveMessage(createdCount, updatedCount));

                setSaving(false);
                onOpenChange(false);

                // The report must show the saved commissions.
                router.reload();

                return;
            }

            const row = rowsToSave[index];
            const isUpdate =
                row.commission_id !== undefined && row.receipt_id !== undefined;

            const payload = {
                boat_id: boatId,
                beneficiary_id: parseInt(row.beneficiary_id),
                commission_per_unit: parseFloat(row.commission_per_unit),
                unit_count: parseFloat(row.unit_count),
                session_zone_id: sessionZoneId,
                date: date,
            };

            const options = {
                preserveScroll: true,
                preserveState: true,

                onSuccess: (page: Page): void => {
                    // The server answers a refusal with a redirect and a flash
                    // error, which Inertia sees as a success: report it here
                    // instead of a fake "saved" message.
                    const flash = page.props.flash as FlashMessage | undefined;

                    if (flash?.error) {
                        setSaving(false);

                        toast.error(flash.error, { duration: 6000 });

                        return;
                    }

                    saveRow(index + 1);
                },

                onError: (errors: Record<string, string>): void => {
                    setSaving(false);

                    // Show the real server error: a generic message used to
                    // hide the validation errors.
                    const firstError = Object.values(errors)[0];

                    toast.error(
                        (typeof firstError === 'string' ? firstError : null) ??
                            "La commission n'a pas pu être enregistrée.",
                    );
                },
            };

            if (isUpdate) {
                // A real PUT is required here: the frontend sends JSON, and
                // Laravel only reads the `_method` trick from a form body.
                router.put(
                    updateCommission([
                        row.receipt_id as number,
                        row.commission_id as number,
                    ]),
                    payload,
                    options,
                );

                return;
            }

            router.post(storeCommission(), payload, options);
        };

        saveRow(0);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-3xl flex-col gap-0 overflow-hidden border border-slate-200 p-0 shadow-lg dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 gap-3 border-b border-slate-300 bg-slate-50/50 p-6 pb-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900 capitalize dark:text-neutral-100">
                            <CircleDollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            Commissions
                            {boatName && (
                                <span className="text-slate-500 dark:text-neutral-400">
                                    : {boatName}
                                </span>
                            )}
                        </DialogTitle>

                        <Badge
                            variant="secondary"
                            className="flex items-center gap-1.5 border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                        >
                            <Ship className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-[12px] font-bold tracking-wide uppercase">
                                {ownerName ?? 'Sans propriétaire'}
                            </span>
                        </Badge>
                    </div>

                    <DialogDescription className="text-sm text-slate-500 dark:text-neutral-400">
                        Modifiez les lignes existantes puis enregistrez, ou
                        ajoutez-en de nouvelles avec le bouton{' '}
                        <Plus className="inline h-3.5 w-3.5" />. La poubelle
                        supprime définitivement une commission.{' '}
                        {ownerIsCompany
                            ? `Le propriétaire du bateau (${ownerName ?? 'société'}) est une société : seule la part du bénéficiaire sera enregistrée.`
                            : `Le propriétaire du bateau (${ownerName ?? 'client'}) sera débité automatiquement.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto dark:bg-neutral-950">
                    <Table className="w-full table-fixed border-collapse">
                        <TableHeader className="sticky top-0 z-20 bg-slate-50/80 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-[25%] py-4 pl-6 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client / Bénéfic.
                                </TableHead>
                                <TableHead className="w-[20%] py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Article
                                </TableHead>
                                <TableHead className="w-[15%] text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Qté
                                </TableHead>
                                <TableHead className="w-[15%] text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    P.Comm
                                </TableHead>
                                <TableHead className="w-[20%] text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Total
                                </TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {drafts.map((row) => (
                                <CommissionRow
                                    key={row.rowKey}
                                    beneficiaries={beneficiaries}
                                    boatId={boatId}
                                    sessionZoneId={sessionZoneId}
                                    date={date}
                                    initialDraft={row}
                                    isPersisted={row.isPersisted}
                                    isDeleting={deletingRowKey === row.rowKey}
                                    onDraftChange={(data) => {
                                        handleDraftChange(row.rowKey, data);
                                    }}
                                    onAddLine={handleAddRow}
                                    onDeleteRow={() => {
                                        handleDeleteRow(row);
                                    }}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="flex-row items-center justify-end gap-3 border-t border-slate-300 bg-slate-50/50 p-4 sm:justify-end dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
                        Total:
                        <span className="font-black text-amber-600 tabular-nums dark:text-amber-400">
                            {total.toFixed(2)} DH
                        </span>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || deletingRowKey !== null}
                        className="h-9 gap-2 text-xs"
                    >
                        {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <CircleDollarSign className="h-3.5 w-3.5" />
                        )}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
