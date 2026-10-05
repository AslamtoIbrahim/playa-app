import {
    destroy,
    storeCommission,
    updateCommission,
} from '@/routes/receipts/items';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useState } from 'react';
import { toast } from 'sonner';
import { ReceiptItem } from '@/types/receipt-item';

interface UseCommissionRowProps {
    boatId: number;
    unitCount: number;
    sessionZoneId: number;
    date: string;
    onSuccess?: () => void;
    commission?: ReceiptItem;
    /** Starting values of the line (draft mode). */
    initialDraft?: CommissionDraft;
    /**
     * Draft mode: the line sends no request, every change is pushed up to the
     * parent (the report commissions dialog).
     */
    onDraftChange?: (data: CommissionDraft) => void;
}

/**
 * Values of a commission line before it is saved.
 */
export interface CommissionDraft {
    beneficiary_id: string;
    commission_per_unit: string;
    unit_count: string;
}

/**
 * A line can be saved when the beneficiary, the quantity and the commission
 * price are filled in and strictly positive.
 */
export function isCommissionDraftValid(draft: CommissionDraft): boolean {
    {
        return (
            draft.beneficiary_id !== '' &&
            Number(draft.commission_per_unit) > 0 &&
            Number(draft.unit_count) > 0
        );
    }
}

export function useCommissionRow({
    boatId,
    unitCount,
    sessionZoneId,
    date,
    onSuccess,
    commission,
    initialDraft,
    onDraftChange,
}: UseCommissionRowProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const [openCustomer, setOpenCustomer] = useState<boolean>(false);

    /** Draft mode: the line is driven by the dialog, not by the API. */
    const isDraft = onDraftChange !== undefined;

    const [data, setData] = useState<CommissionDraft>(() => {
        {
            return (
                initialDraft ?? {
                    beneficiary_id:
                        commission?.receipt?.customer?.id?.toString() || '',
                    commission_per_unit:
                        commission?.real_price?.toString() || '',
                    unit_count: commission
                        ? commission.unit_count.toString()
                        : unitCount.toString(),
                }
            );
        }
    });

    const handleDataChange = (updates: Partial<CommissionDraft>): void => {
        const next = { ...data, ...updates };

        setData(next);

        if (onDraftChange) {
            onDraftChange(next);
        }
    };

    const isReadyToSave = (currentData = data): boolean => {
        {
            return isCommissionDraftValid(currentData);
        }
    };

    /**
     * Save or update a commission.
     *
     * In draft mode nothing is sent from the line: the dialog validates and
     * saves the whole set of drafts with its own button.
     */
    const submitSave = (currentData = data): void => {
        if (isDraft) {
            return;
        }

        {
            if (!isReadyToSave(currentData) || loading) {
                {
                    return;
                }
            }
        }

        setLoading(true);

        const isUpdate = !!commission?.id;

        const payload = {
            boat_id: boatId,
            beneficiary_id: parseInt(currentData.beneficiary_id),
            commission_per_unit: parseFloat(currentData.commission_per_unit),
            unit_count: parseFloat(currentData.unit_count),
            session_zone_id: sessionZoneId,
            date: date,
        };

        const options = {
            preserveScroll: true,

            onSuccess: (): void => {
                {
                    router.reload({
                        only: ['receipts', 'reports', 'invoices'],
                    });

                    toast.success(
                        isUpdate
                            ? 'Commission mise à jour ✅'
                            : 'Commission enregistrée ✅',
                    );

                    if (!isUpdate) {
                        {
                            setData({
                                beneficiary_id: '',
                                commission_per_unit: '',
                                unit_count: unitCount.toString(),
                            });
                        }
                    }

                    if (onSuccess) {
                        {
                            onSuccess();
                        }
                    }
                }
            },

            onFinish: (): void => {
                {
                    setLoading(false);
                }
            },
        };

        // A real PUT is required: the frontend sends JSON and Laravel only
        // reads the `_method` trick from a form encoded body.
        if (isUpdate && commission) {
            router.put(
                updateCommission([commission.receipt_id, commission.id]),
                payload,
                options,
            );

            return;
        }

        router.post(storeCommission(), payload, options);
    };

    /** Delete a saved commission (both legs) after a confirmation. */
    const deleteCommission = (): void => {
        {
            if (!commission || loading) {
                {
                    return;
                }
            }
        }

        const confirmDelete = window.confirm('Supprimer cette commission ?');

        {
            if (!confirmDelete) {
                {
                    return;
                }
            }
        }

        setLoading(true);

        router.delete(destroy([commission.receipt_id, commission.id]), {
            preserveScroll: true,

            onSuccess: (): void => {
                {
                    toast.success('Commission supprimée');

                    router.reload({
                        only: ['receipts', 'reports', 'invoices'], // حدد الـ props اللي بغيتي تفرش
                    });

                    if (onSuccess) {
                        {
                            onSuccess();
                        }
                    }
                }
            },

            onFinish: (): void => {
                {
                    setLoading(false);
                }
            },
        });
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLElement>,
        type?: 'customer',
    ): void => {
        {
            if (openCustomer) {
                {
                    return;
                }
            }
        }

        const isClearKey = e.key === 'Backspace' || e.key === 'Delete';

        {
            if (isClearKey && type === 'customer') {
                {
                    e.preventDefault();

                    if (data.beneficiary_id !== '') {
                        {
                            handleDataChange({ beneficiary_id: '' });
                        }
                    }

                    return;
                }
            }
        }

        {
            if (type === 'customer' && !openCustomer) {
                {
                    const isCharacter =
                        e.key.length === 1 &&
                        e.key.match(/[a-z0-9\u0600-\u06FF]/i);

                    if (isCharacter) {
                        {
                            setOpenCustomer(true);

                            return;
                        }
                    }
                }
            }
        }

        {
            if (e.key === 'Enter') {
                {
                    e.preventDefault();

                    if (isReadyToSave(data)) {
                        {
                            submitSave(data);
                        }
                    }
                }
            }
        }

        // Navigation entre les cellules du tableau (flèches directionnelles).
        navigateToAdjacentCell(e);
    };

    return {
        data,
        handleDataChange,
        loading,
        openCustomer,
        setOpenCustomer,
        handleKeyDown,
        submitSave,
        deleteCommission,
    };
}
