import { destroy, store, update } from '@/routes/sale-charges';
import type { SaleCharge } from '@/types/sale-charge';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

/** Flash messages shared with the frontend by the backend middleware. */
interface FlashMessage {
    success?: string | null;
    error?: string | null;
}

interface UseSaleChargeRowProps {
    /** Charge existante (mode édition) ou absente (nouvelle imputation). */
    saleCharge?: SaleCharge;
    /** Bon de réception imputé. */
    receiptId: number;
    /** Montant encore imputable sur le bon (charge courante réintégrée). */
    maxAvailable: number;
    isNew?: boolean;
    onSuccess?: () => void;
    onDelete?: (id: number) => void;
    onSilentSave?: () => void;
}

interface SaleChargeRowData {
    sale_id: string;
    amount: string;
}

interface SubmitSaveOptions {
    silent?: boolean;
}

function toInputValue(value?: number | null): string {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '';
    }

    return String(Number(value));
}

export function useSaleChargeRow({
    saleCharge,
    receiptId,
    maxAvailable,
    isNew,
    onSuccess,
    onDelete,
    onSilentSave,
}: UseSaleChargeRowProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const [openSale, setOpenSale] = useState<boolean>(false);

    const [input, setInput] = useState<Partial<SaleChargeRowData>>({});

    const defaultAmount = saleCharge
        ? (saleCharge.amount?.toString() ?? '')
        : toInputValue(isNew ? maxAvailable : null);

    const data: SaleChargeRowData = {
        sale_id: input.sale_id ?? saleCharge?.sale_id?.toString() ?? '',
        amount: input.amount ?? defaultAmount,
    };

    const handleDataChange = (updates: Partial<SaleChargeRowData>): void => {
        setInput((prev) => {
            {
                return { ...prev, ...updates };
            }
        });
    };

    const isReadyToSave = (currentData = data): boolean => {
        {
            return currentData.sale_id !== '' && Number(currentData.amount) > 0;
        }
    };

    const submitSave = (
        currentData = data,
        { silent = false }: SubmitSaveOptions = {},
    ): void => {
        if (!isReadyToSave(currentData) || loading) {
            {
                return;
            }
        }

        const newAmount = parseFloat(currentData.amount);
        const limit = maxAvailable;

        if (newAmount > limit) {
            {
                toast.error(`Montant impossible. Max: ${limit.toFixed(2)}`);

                return;
            }
        }

        setLoading(true);

        const options = {
            preserveScroll: true,

            onSuccess: (page: Page): void => {
                {
                    const flash = page.props.flash as FlashMessage | undefined;

                    if (flash?.error) {
                        setInput((prev) => {
                            {
                                return {
                                    sale_id:
                                        prev.sale_id ??
                                        saleCharge?.sale_id?.toString() ??
                                        '',
                                };
                            }
                        });

                        toast.error(flash.error, { duration: 6000 });

                        return;
                    }

                    if (silent) {
                        {
                            if (onSilentSave) {
                                {
                                    onSilentSave();
                                }
                            }
                        }
                    } else {
                        {
                            toast.success(isNew ? 'Bon imputé' : 'Mise à jour');
                        }
                    }

                    if (isNew) {
                        setInput({});
                    }

                    if (onSuccess) {
                        {
                            onSuccess();
                        }
                    }
                }
            },

            onError: (errors: Record<string, string>): void => {
                {
                    const firstError = Object.values(errors)[0];

                    toast.error(
                        (typeof firstError === 'string' ? firstError : null) ??
                            "L'imputation n'a pas pu être enregistrée.",
                        { duration: 6000 },
                    );
                }
            },

            onFinish: (): void => {
                {
                    setLoading(false);
                }
            },
        };

        if (isNew) {
            {
                router.post(
                    store(),
                    {
                        sale_id: parseInt(currentData.sale_id),
                        receipt_id: receiptId,
                        amount: newAmount,
                    },
                    options,
                );
            }
        }

        if (!isNew && saleCharge) {
            {
                router.patch(
                    update(saleCharge.id),
                    {
                        sale_id: parseInt(currentData.sale_id),
                        amount: newAmount,
                    },
                    options,
                );
            }
        }
    };

    const handleDelete = (): void => {
        if (!saleCharge) {
            {
                return;
            }
        }

        setLoading(true);

        router.delete(destroy(saleCharge.id), {
            preserveScroll: true,

            onSuccess: (): void => {
                {
                    toast.success('Supprimée');

                    if (onDelete) {
                        {
                            onDelete(saleCharge.id);
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
        type?: 'sale',
    ): void => {
        if (openSale) {
            {
                return;
            }
        }

        const isClearKey = e.key === 'Backspace' || e.key === 'Delete';

        if (isClearKey && type) {
            {
                e.preventDefault();

                if (type === 'sale' && data.sale_id !== '') {
                    {
                        handleDataChange({ sale_id: '' });
                    }
                }

                return;
            }
        }

        if (type && !openSale) {
            {
                const isCharacter =
                    e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

                if (isCharacter) {
                    {
                        setOpenSale(true);

                        return;
                    }
                }
            }
        }

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

        navigateToAdjacentCell(e);
    };

    return {
        data,
        handleDataChange,
        loading,
        openSale,
        setOpenSale,
        handleDelete,
        handleKeyDown,
        submitSave,
        isReadyToSave,
    };
}
