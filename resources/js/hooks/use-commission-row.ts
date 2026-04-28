import { destroy, storeCommission, updateCommission } from '@/routes/receipts/items';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useState } from 'react';
import { toast } from 'sonner';
import { ReceiptItem } from '@/types/receipt-item';

interface UseCommissionRowProps {
    invoiceItemId: number;
    unitCount: number;
    sessionId: number;
    date: string;
    onSuccess?: () => void;
    commission?: ReceiptItem;
}

export function useCommissionRow({
    invoiceItemId,
    unitCount,
    sessionId,
    date,
    onSuccess,
    commission
}: UseCommissionRowProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const [openCustomer, setOpenCustomer] = useState<boolean>(false);

    const [data, setData] = useState({
        beneficiary_id: commission?.receipt?.customer?.id?.toString() || '',
        commission_per_unit: commission?.real_price?.toString() || '',
        unit_count: commission ? commission.unit_count.toString() : unitCount.toString(),
    });

    const handleDataChange = (updates: Partial<typeof data>): void => {
        setData((prev) => {
            {
                return { ...prev, ...updates };
            }
        });
    };

    const isReadyToSave = (currentData = data): boolean => {
        {
            return (
                currentData.beneficiary_id !== '' &&
                Number(currentData.commission_per_unit) > 0 &&
                Number(currentData.unit_count) > 0
            );
        }
    };

    /**
     * Enregistrer ou mettre à jour une commission
     */
    const submitSave = (currentData = data): void => {
        {
            if (!isReadyToSave(currentData) || loading) {
                {
                    return;
                }
            }
        }

        setLoading(true);

        const isUpdate = !!commission?.id;

        const url = isUpdate
            ? updateCommission([commission.receipt_id, commission.id])
            : storeCommission();

        router.post(
            url,
            {
                _method: isUpdate ? 'PUT' : 'POST',
                invoice_item_id: invoiceItemId,
                beneficiary_id: parseInt(currentData.beneficiary_id),
                commission_per_unit: parseFloat(currentData.commission_per_unit),
                unit_count: parseFloat(currentData.unit_count),
                session_id: sessionId,
                date: date,
            },
            {
                preserveScroll: true,

                onSuccess: (): void => {
                    {
                        toast.success(isUpdate ? 'Commission mise à jour ✅' : 'Commission enregistrée ✅');

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
            }
        );
    };

    /**
     * Supprimer une commission existante
     */
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

        router.delete(
            destroy([commission.receipt_id, commission.id]),
            {
                preserveScroll: true,

                onSuccess: (): void => {
                    {
                        toast.success('Commission supprimée');

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
            }
        );
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLElement>,
        type?: 'customer'
    ): void => {
        {
            if (openCustomer) {
                {
                    return;
                }
            }
        }

        {
            if (type === 'customer' && !openCustomer) {
                {
                    const isCharacter = e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

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

        const isMovementKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

        {
            if (isMovementKey) {
                {
                    e.preventDefault();

                    const currentCell = (e.target as HTMLElement).closest('td');

                    if (!currentCell) {
                        {
                            return;
                        }
                    }

                    const focusElement = (el: Element | null): void => {
                        {
                            const target = el?.querySelector('input, button, [role="combobox"]') as HTMLElement;

                            if (target) {
                                {
                                    target.focus();

                                    if (target instanceof HTMLInputElement) {
                                        {
                                            target.select();
                                        }
                                    }
                                }
                            }
                        }
                    };

                    const cellIndex = (currentCell as HTMLTableCellElement).cellIndex;

                    {
                        if (e.key === 'ArrowRight') {
                            {
                                focusElement(currentCell.nextElementSibling);
                            }
                        }
                    }

                    {
                        if (e.key === 'ArrowLeft') {
                            {
                                focusElement(currentCell.previousElementSibling);
                            }
                        }
                    }

                    {
                        if (e.key === 'ArrowDown') {
                            {
                                focusElement(
                                    currentCell.parentElement?.nextElementSibling?.children[cellIndex] || null
                                );
                            }
                        }
                    }

                    {
                        if (e.key === 'ArrowUp') {
                            {
                                focusElement(
                                    currentCell.parentElement?.previousElementSibling?.children[cellIndex] || null
                                );
                            }
                        }
                    }
                }
            }
        }
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