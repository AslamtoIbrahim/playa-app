import { destroy, store, update } from '@/routes/differences';
import { Difference } from '@/types/difference';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useState } from 'react';
import { toast } from 'sonner';

interface UseDifferenceRowProps {
    diff?: Difference;
    maxAvailable: number;
    isNew?: boolean;
    invoiceItemId?: number;
    onSuccess?: (newDiff: Difference) => void;
    onDelete?: (id: number) => void;
    defaultCustomerId?: number;
}

export function useDifferenceRow({
    diff,
    maxAvailable,
    isNew,
    invoiceItemId,
    onSuccess,
    onDelete,
    defaultCustomerId,
}: UseDifferenceRowProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const [openCustomer, setOpenCustomer] = useState<boolean>(false);

    const [openItem, setOpenItem] = useState<boolean>(false);

    const [data, setData] = useState({
        customer_id:
            diff?.customer_id.toString() || defaultCustomerId?.toString() || '',
        item_id: diff?.item_id?.toString() || '',
        unit_count: diff?.unit_count.toString() || '',
        real_price: diff?.real_price.toString() || '',
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
                currentData.customer_id !== '' &&
                currentData.item_id !== '' &&
                Number(currentData.unit_count) > 0 &&
                Number(currentData.real_price) > 0
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

        const limit = isNew
            ? maxAvailable
            : maxAvailable + Number(diff?.unit_count);

        if (newCount > limit) {
            {
                toast.error(`Quantité impossible. Max: ${limit.toFixed(2)}`);

                return;
            }
        }

        setLoading(true);

        const options = {
            preserveScroll: true,

            onSuccess: (page: any): void => {
                {
                    toast.success(isNew ? 'Ajouté' : 'Mis à jour');

                    if (isNew) {
                        {
                            setData({
                                // On réapplique le client par défaut (propriétaire
                                // du bateau) pour rester cohérent avec l'état
                                // initial de la ligne.
                                customer_id:
                                    defaultCustomerId?.toString() || '',
                                item_id: '',
                                unit_count: '',
                                real_price: '',
                            });
                        }
                    }

                    const updatedItem = page.props.flash?.updated_item;

                    const differences =
                        updatedItem?.differences || page.props.differences;

                    if (onSuccess && differences) {
                        {
                            const res = isNew
                                ? differences[differences.length - 1]
                                : differences.find(
                                      (d: any) => d.id === diff?.id,
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
