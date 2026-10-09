import { destroy, store, update } from '@/routes/differences';
import { Difference } from '@/types/difference';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { KeyboardEvent, useState } from 'react';
import { toast } from 'sonner';

interface FlashMessage {
    error?: string | null;
    updated_item?: {
        differences?: Difference[];
    };
}

interface UseDifferenceRowProps {
    diff?: Difference;
    maxAvailable: number;
    isNew?: boolean;
    invoiceItemId?: number;
    onSuccess?: (newDiff: Difference) => void;
    onDelete?: (id: number) => void;
    defaultCustomerId?: number;
    defaultItemId?: number;
    unitPrice?: number;
}

function toInputValue(value?: number | null): string {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '';
    }

    return String(Number(value));
}

export function useDifferenceRow({
    diff,
    maxAvailable,
    isNew,
    invoiceItemId,
    onSuccess,
    onDelete,
    defaultCustomerId,
    defaultItemId,
    unitPrice,
}: UseDifferenceRowProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const [openCustomer, setOpenCustomer] = useState<boolean>(false);

    const [openItem, setOpenItem] = useState<boolean>(false);

    const [input, setInput] = useState<Partial<DifferenceRowData>>({});

    const data: DifferenceRowData = {
        customer_id:
            input.customer_id ??
            diff?.customer_id.toString() ??
            defaultCustomerId?.toString() ??
            '',
        item_id:
            input.item_id ??
            diff?.item_id?.toString() ??
            defaultItemId?.toString() ??
            '',
        unit_count:
            input.unit_count ??
            diff?.unit_count.toString() ??
            toInputValue(isNew ? maxAvailable : null),
        real_price:
            input.real_price ??
            diff?.real_price.toString() ??
            toInputValue(isNew ? unitPrice : null),
    };

    const handleDataChange = (updates: Partial<DifferenceRowData>): void => {
        setInput((prev) => {
            {
                return { ...prev, ...updates };
            }
        });
    };

    const isReadyToSave = (currentData = data): boolean => {
        {
            return (
                currentData.customer_id !== '' &&
                currentData.item_id !== '' &&
                Number(currentData.unit_count) > 0 &&
                currentData.real_price !== ''
            );
        }
    };

    const submitSave = (currentData = data): void => {
        if (!isReadyToSave(currentData) || loading) {
            {
                return;
            }
        }

        const newCount = parseFloat(currentData.unit_count);

        const limit = maxAvailable;

        if (newCount > limit) {
            {
                toast.error(`Quantité impossible. Max: ${limit.toFixed(2)}`);

                return;
            }
        }

        setLoading(true);

        const options = {
            preserveScroll: true,

            onSuccess: (page: Page): void => {
                {
                    const flash = page.props.flash as
                        | FlashMessage
                        | undefined;

                    if (flash?.error) {
                        toast.error(flash.error, { duration: 6000 });

                        return;
                    }

                    toast.success(isNew ? 'Ajouté' : 'Mis à jour');

                    if (isNew) {
                        {
                            // The updated remaining quantity and invoice price
                            // become the defaults for the next distribution.
                            setInput({});
                        }
                    }

                    const updatedItem = flash?.updated_item;

                    const differences: Difference[] | undefined =
                        updatedItem?.differences ??
                        (page.props.differences as Difference[] | undefined);

                    if (onSuccess && differences) {
                        {
                            const res = isNew
                                ? differences[differences.length - 1]
                                : differences.find(
                                      (difference) =>
                                          difference.id === diff?.id,
                                  );

                            if (res) {
                                {
                                    onSuccess(res);
                                }
                            }
                        }
                    }
                }
            },

            onFinish: (): void => {
                {
                    setLoading(false);
                }
            },

            onError: (errors: Record<string, string>): void => {
                {
                    const firstError = Object.values(errors)[0];

                    toast.error(
                        (typeof firstError === 'string' ? firstError : null) ??
                            "La répartition n'a pas pu être enregistrée.",
                        { duration: 6000 },
                    );
                }
            },
        };

        if (isNew) {
            {
                router.post(
                    store(),
                    {
                        invoice_item_id: invoiceItemId,
                        customer_id: parseInt(currentData.customer_id),
                        item_id: parseInt(currentData.item_id),
                        unit_count: newCount,
                        real_price: parseFloat(currentData.real_price),
                    },
                    options,
                );
            }
        }

        if (!isNew && diff) {
            {
                router.patch(
                    update(diff.id),
                    {
                        customer_id: parseInt(currentData.customer_id),
                        item_id: parseInt(currentData.item_id),
                        unit_count: newCount,
                        real_price: parseFloat(currentData.real_price),
                    },
                    options,
                );
            }
        }
    };

    const handleDelete = (): void => {
        if (!diff) {
            {
                return;
            }
        }

        setLoading(true);

        router.delete(destroy(diff.id), {
            preserveScroll: true,

            onSuccess: (): void => {
                {
                    toast.success('Supprimé');

                    if (onDelete) {
                        {
                            onDelete(diff.id);
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
        type?: 'customer' | 'item',
    ): void => {
        if (openCustomer || openItem) {
            {
                return;
            }
        }

        const isClearKey = e.key === 'Backspace' || e.key === 'Delete';

        if (isClearKey && type) {
            {
                e.preventDefault();

                if (type === 'customer' && data.customer_id !== '') {
                    {
                        handleDataChange({ customer_id: '' });
                    }
                }

                if (type === 'item' && data.item_id !== '') {
                    {
                        handleDataChange({ item_id: '' });
                    }
                }

                return;
            }
        }

        if (type && !openCustomer && !openItem) {
            {
                const isCharacter =
                    e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

                if (isCharacter) {
                    {
                        type === 'customer'
                            ? setOpenCustomer(true)
                            : setOpenItem(true);

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

        // Navigation entre les cellules du tableau (flèches directionnelles).
        navigateToAdjacentCell(e);
    };

    return {
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
    };
}

interface DifferenceRowData {
    customer_id: string;
    item_id: string;
    unit_count: string;
    real_price: string;
}
