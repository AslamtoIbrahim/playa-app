import { store, update } from '@/routes/invoices/items';
import { InvoiceItem } from '@/types/invoice-item';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useState } from 'react';

interface UseInvoiceItemProps {
    invoiceId: number;
    item?: InvoiceItem;
    isNew?: boolean;
}

export function useInvoiceItem({ invoiceId, item, isNew }: UseInvoiceItemProps) {
    const [loading, setLoading] = useState(false);
    const [openBoat, setOpenBoat] = useState(false);
    const [openItem, setOpenItem] = useState(false);

    const [data, setData] = useState({
        boat_id: item?.boat_id || '',
        item_id: item?.item_id || '',
        unit_count: item?.unit_count || '',
        unit_price: item?.unit_price || '',
        unit: item?.unit || 'caisse',
        box: item?.box || '',
        weight: item?.weight || '',
    });

    const count = Number(data.unit_count) || 0;

    const amount = count * Number(data.unit_price);

    // Derived Logic for Box (Computed based on unit)
    const displayBox = data.unit === 'caisse' ? data.unit_count : data.box;

    const handleDataChange = (updates: Partial<typeof data>) => {
        setData((prev) => {
            const newData = { ...prev, ...updates };

            // Logic for unit_count change
            if (Object.prototype.hasOwnProperty.call(updates, 'unit_count')) {
                {
                    const newCount = Number(updates.unit_count) || 0;

                    if (newData.unit === 'caisse') {
                        {
                            newData.weight = (newCount * 21).toString();
                            newData.box = newCount.toString();
                        }
                    } else {
                        {
                            newData.weight = newCount.toString();
                        }
                    }
                }
            }

            // Logic for unit change
            if (Object.prototype.hasOwnProperty.call(updates, 'unit')) {
                {
                    const currentCount = Number(newData.unit_count) || 0;

                    newData.weight = newData.unit === 'caisse'
                        ? (currentCount * 21).toString()
                        : currentCount.toString();
                }
            }

            return newData;
        });
    };

    const isReadyToSave = (currentData = data) => {
        if (isNew) {
            {
                return (
                    currentData.boat_id !== '' &&
                    currentData.item_id !== '' &&
                    Number(currentData.unit_price) > 0 &&
                    Number(currentData.unit_count) > 0
                );
            }
        }

        return true;
    };

    const submitSave = (currentData = data) => {
        if (!isReadyToSave(currentData) || loading) {
            {
                return;
            }
        }

        setLoading(true);

        const url = isNew
            ? store(invoiceId)
            : update({ invoice: invoiceId, item: item!.id });

        const payload = {
            ...currentData,
            box: currentData.unit === 'caisse' ? currentData.unit_count : currentData.box,
            weight: currentData.weight.toString(),
            _method: isNew ? 'POST' : 'PATCH',
        };

        router.post(
            url,
            payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (isNew) {
                        {
                            setData({
                                boat_id: '',
                                item_id: '',
                                unit_count: '',
                                unit_price: '',
                                unit: 'caisse',
                                box: '',
                                weight: '',
                            });
                        }
                    }
                },
                onFinish: () => {
                    {
                        setLoading(false);
                    }
                },
            },
        );
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLElement>,
        type?: 'boat' | 'item',
    ) => {
        if (openBoat || openItem) {
            {
                return;
            }
        }

        if (type && !openBoat && !openItem) {
            {
                const isCharacter = e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

                if (isCharacter) {
                    {
                        type === 'boat' ? setOpenBoat(true) : setOpenItem(true);

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

        const isMovementKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

        if (isMovementKey) {
            {
                e.preventDefault();

                const currentCell = (e.target as HTMLElement).closest('td');

                if (!currentCell) {
                    {
                        return;
                    }
                }

                const focusElement = (el: Element | null) => {
                    const target = el?.querySelector('input, button, select') as HTMLElement;

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
                };

                if (e.key === 'ArrowRight') {
                    {
                        focusElement(currentCell.nextElementSibling);
                    }
                }

                if (e.key === 'ArrowLeft') {
                    {
                        focusElement(currentCell.previousElementSibling);
                    }
                }

                if (e.key === 'ArrowDown') {
                    {
                        focusElement(currentCell.parentElement?.nextElementSibling?.children[currentCell.cellIndex] || null);
                    }
                }

                if (e.key === 'ArrowUp') {
                    {
                        focusElement(currentCell.parentElement?.previousElementSibling?.children[currentCell.cellIndex] || null);
                    }
                }
            }
        }
    };

    return {
        data,
        handleDataChange,
        loading,
        openBoat,
        setOpenBoat,
        openItem,
        setOpenItem,
        weight: data.weight,
        amount,
        displayBox,
        isReadyToSave,
        submitSave,
        handleKeyDown,
    };
}