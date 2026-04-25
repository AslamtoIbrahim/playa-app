import { store, update } from '@/routes/receipts/items';
import { ReceiptItem } from '@/types/receipt-item';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useState } from 'react';

interface UseReceiptItemProps {
    receiptId: number;
    item?: ReceiptItem;
    isNew?: boolean;
}

export function useReceiptItem({ receiptId, item, isNew }: UseReceiptItemProps) {
    const [loading, setLoading] = useState(false);

    const [openItem, setOpenItem] = useState(false);

    const [data, setData] = useState({
        item_id: item?.item_id || '',
        unit_count: item?.unit_count || '',
        real_price: item?.real_price || '',
        box: item?.box || '',
    });

    // حساب المجموع مباشرة يدعم القيم السالبة والموجبة
    const rowTotal = Number(data.unit_count || 0) * Number(data.real_price || 0);

    const handleDataChange = (updates: Partial<typeof data>) => {
        setData((prev) => {
            const newData = { ...prev, ...updates };

            return newData;
        });
    };

    const isReadyToSave = (currentData = data) => {
        if (isNew) {
            // التحقق فقط من الكمية والسعر (يجب ألا يكونا صفراً)
            const hasValidPrice = currentData.real_price !== '' && Number(currentData.real_price) !== 0;

            const hasValidQuantity = currentData.unit_count !== '' && Number(currentData.unit_count) !== 0;

            return hasValidPrice && hasValidQuantity;
        }

        return true;
    };

    const submitSave = (currentData = data) => {
        if (!isReadyToSave(currentData) || loading) {
            return;
        }

        setLoading(true);

        const url = isNew
            ? store(receiptId)
            : update({ receipt: receiptId, item: item!.id });

        // تحويل القيم الفارغة إلى null لكي يقبلها الـ Backend
        const payload = {
            ...currentData,
            item_id: currentData.item_id || null,
            box: currentData.box || 0,
            _method: isNew ? 'POST' : 'PATCH',
        };

        router.post(
            url,
            payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (isNew) {
                        setData({
                            item_id: '',
                            unit_count: '',
                            real_price: '',
                            box: '',
                        });
                    }
                },
                onFinish: () => {
                    setLoading(false);
                },
            },
        );
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLElement>,
        type?: 'item',
    ) => {
        if (openItem) {
            return;
        }

        if (type && !openItem) {
            const isCharacter = e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

            if (isCharacter) {
                setOpenItem(true);

                return;
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();

            if (isReadyToSave(data)) {
                submitSave(data);
            }
        }

        const isMovementKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

        if (isMovementKey) {
            e.preventDefault();

            const currentCell = (e.target as HTMLElement).closest('td');

            if (!currentCell) {
                return;
            }

            const focusElement = (el: Element | null) => {
                const target = el?.querySelector('input, button, select') as HTMLElement;

                if (target) {
                    target.focus();

                    if (target instanceof HTMLInputElement) {
                        target.select();
                    }
                }
            };

            if (e.key === 'ArrowRight') {
                focusElement(currentCell.nextElementSibling);
            }

            if (e.key === 'ArrowLeft') {
                focusElement(currentCell.previousElementSibling);
            }

            if (e.key === 'ArrowDown') {
                focusElement(currentCell.parentElement?.nextElementSibling?.children[currentCell.cellIndex] || null);
            }

            if (e.key === 'ArrowUp') {
                focusElement(currentCell.parentElement?.previousElementSibling?.children[currentCell.cellIndex] || null);
            }
        }
    };

    return {
        data,
        rowTotal,
        handleDataChange,
        loading,
        openItem,
        setOpenItem,
        isReadyToSave,
        submitSave,
        handleKeyDown,
    };
}