import { destroy, store, update } from '@/routes/sale-items';
import { SaleItem } from '@/types/sale-item';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useState } from 'react';
import { toast } from 'sonner';

interface UseSaleRowProps {
    /** Distribution existante (mode édition) ou absente (nouvelle vente). */
    saleItem?: SaleItem;
    /** Ligne de facture d'achat vendue. */
    invoiceItemId: number;
    /** Quantité encore vendable sur la ligne de facture. */
    maxAvailable: number;
    isNew?: boolean;
    onSuccess?: () => void;
    onDelete?: (id: number) => void;
}

/**
 * Enregistrement d'une vente depuis une ligne de facture d'achat.
 *
 * Le dialogue de vente reprend la mécanique du dialogue de répartition : une
 * ligne « nouvelle » se valide automatiquement (bouton ✓), une ligne
 * existante se met à jour au fil de la saisie et se supprime à la corbeille.
 */
export function useSaleRow({
    saleItem,
    invoiceItemId,
    maxAvailable,
    isNew,
    onSuccess,
    onDelete,
}: UseSaleRowProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const [openSale, setOpenSale] = useState<boolean>(false);

    const [data, setData] = useState({
        sale_id: saleItem?.sale_id?.toString() || '',
        unit_count: saleItem?.unit_count?.toString() || '',
        real_price: saleItem?.real_price?.toString() || '',
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
                currentData.sale_id !== '' &&
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

        const limit = isNew
            ? maxAvailable
            : maxAvailable + Number(saleItem?.unit_count);

        if (newCount > limit) {
            {
                toast.error(`Quantité impossible. Max: ${limit.toFixed(2)}`);

                return;
            }
        }

        setLoading(true);

        const options = {
            preserveScroll: true,

            onSuccess: (): void => {
                {
                    toast.success(isNew ? 'Vente enregistrée' : 'Mise à jour');

                    if (isNew) {
                        {
                            setData({
                                sale_id: '',
                                unit_count: '',
                                real_price: '',
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

        if (isNew) {
            {
                router.post(
                    store(),
                    {
                        sale_id: parseInt(currentData.sale_id),
                        invoice_item_id: invoiceItemId,
                        unit_count: newCount,
                        real_price: parseFloat(currentData.real_price),
                    },
                    options,
                );
            }
        }

        if (!isNew && saleItem) {
            {
                router.patch(
                    update(saleItem.id),
                    {
                        unit_count: newCount,
                        real_price: parseFloat(currentData.real_price),
                    },
                    options,
                );
            }
        }
    };

    const handleDelete = (): void => {
        if (!saleItem) {
            {
                return;
            }
        }

        setLoading(true);

        router.delete(destroy(saleItem.id), {
            preserveScroll: true,

            onSuccess: (): void => {
                {
                    toast.success('Supprimée');

                    if (onDelete) {
                        {
                            onDelete(saleItem.id);
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
                    e.key.length === 1 &&
                    e.key.match(/[a-z0-9\u0600-\u06FF]/i);

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