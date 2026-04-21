import { destroy, store, update } from '@/routes/differences';
import { Difference } from '@/types/difference';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseDifferenceRowProps {
    diff?: Difference;
    maxAvailable: number;
    isNew?: boolean;
    invoiceItemId?: number;
    onSuccess?: (newDiff: Difference) => void;
    onDelete?: (id: number) => void;
}

export function useDifferenceRow({
    diff,
    maxAvailable,
    isNew,
    invoiceItemId,
    onSuccess,
    onDelete,
}: UseDifferenceRowProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [openCustomer, setOpenCustomer] = useState<boolean>(false);

    const countRef = useRef<HTMLInputElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);

    const [localData, setLocalData] = useState({
        customer_id: diff?.customer_id.toString() || '',
        unit_count: diff?.unit_count.toString() || '',
        real_price: diff?.real_price.toString() || '',
    });

    const handleUpdate = (
        overrides: Record<string, string> = {},
        isManualEnter: boolean = false,
    ): void => {
        const currentCount = overrides.unit_count ?? countRef.current?.value ?? localData.unit_count;
        const currentPrice = overrides.real_price ?? priceRef.current?.value ?? localData.real_price;
        const currentCustomer = overrides.customer_id ?? localData.customer_id;

        const updatedData = {
            customer_id: currentCustomer,
            unit_count: currentCount,
            real_price: currentPrice,
        };

        if (isNew) {
            const hasAllFields =
                updatedData.customer_id &&
                updatedData.customer_id.trim() !== '' &&
                updatedData.unit_count.trim() !== '' &&
                updatedData.real_price.trim() !== '';

            if (!hasAllFields) {
                if (isManualEnter) {
                    toast.error('Veuillez remplir tous les champs');
                }

                return;
            }
        }

        {
            const isSame =
                !isNew &&
                updatedData.customer_id === diff?.customer_id.toString() &&
                updatedData.unit_count === diff?.unit_count.toString() &&
                updatedData.real_price === diff?.real_price.toString();

            if (isSame) {
                return;
            }
        }

        const newCount = parseFloat(updatedData.unit_count);
        const limit = isNew ? maxAvailable : maxAvailable + Number(diff?.unit_count);

        if (newCount > limit) {
            toast.error(`Quantité impossible. Max: ${limit.toFixed(2)}`);

            if (!isNew && diff) {
                setLocalData({
                    customer_id: diff.customer_id.toString(),
                    unit_count: diff.unit_count.toString(),
                    real_price: diff.real_price.toString(),
                });
            }

            return;
        }

        setLoading(true);

        const options = {
            preserveScroll: true,

            onSuccess: (page: any): void => {
                toast.success(isNew ? 'Ajouté' : 'Mis à jour');

                if (isNew) {
                    setLocalData({
                        customer_id: '',
                        unit_count: '',
                        real_price: '',
                    });

                    // كنقلبو على الـ SearchSelect ف السطر الجديد اللي عندو data-new-row
                    setTimeout(() => {
                        const nextInput = document.querySelector('[data-new-row="true"] button') as HTMLElement;

                        if (nextInput) {
                            nextInput.focus();
                        } else {
                            setOpenCustomer(true);
                        }
                    }, 50);
                }

                const updatedItem = page.props.flash?.updated_item;
                const differences = updatedItem?.differences || page.props.differences;

                if (onSuccess && differences) {
                    const res = isNew ? differences[differences.length - 1] : differences.find((d: any) => d.id === diff?.id);

                    if (res) {
                        onSuccess(res);
                    }
                }
            },

            onFinish: (): void => {
                setLoading(false);
            },

            onError: (err: any): void => {
                setLoading(false);
                console.error('Inertia Error:', err);
            },
        };

        if (isNew) {
            router.post(store(), {
                invoice_item_id: invoiceItemId,
                customer_id: parseInt(updatedData.customer_id),
                unit_count: newCount,
                real_price: parseFloat(updatedData.real_price),
            }, options);
        }

        if (!isNew && diff) {
            router.patch(update(diff.id), {
                customer_id: parseInt(updatedData.customer_id),
                unit_count: newCount,
                real_price: parseFloat(updatedData.real_price),
            }, options);
        }
    };

    const handleDelete = (): void => {
        if (!diff) {
            return;
        }

        setLoading(true);

        router.delete(destroy(diff.id), {
            preserveScroll: true,

            onSuccess: (): void => {
                toast.success('Supprimé');

                if (onDelete) {
                    onDelete(diff.id);
                }
            },

            onFinish: (): void => {
                setLoading(false);
            },
        });
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLElement>,
        type?: 'customer' | 'count' | 'price',
    ): void => {
        const target = e.target as HTMLInputElement;

        if (type === 'customer' && !openCustomer) {
            const isCharacter = e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

            if (isCharacter) {
                setOpenCustomer(true);

                return;
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();

            const currentOverrides: Record<string, string> = {};

            if (type === 'count') {
                currentOverrides.unit_count = target.value;
            }

            if (type === 'price') {
                currentOverrides.real_price = target.value;
            }

            handleUpdate(currentOverrides, true);
        }

        const isMovementKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

        if (isMovementKey && !openCustomer) {
            const currentCell = target.closest('td');

            if (!currentCell) {
                return;
            }

            const focusElement = (el: Element | null): void => {
                const innerTarget = el?.querySelector('input, button, [role="combobox"]') as HTMLElement;

                if (innerTarget) {
                    e.preventDefault();
                    innerTarget.focus();

                    if (innerTarget instanceof HTMLInputElement) {
                        innerTarget.select();
                    }
                }
            };

            const currentRow = currentCell.parentElement as HTMLTableRowElement;
            const cellIndex = (currentCell as HTMLTableCellElement).cellIndex;

            if (e.key === 'ArrowRight') {
                focusElement(currentCell.nextElementSibling);
            }

            if (e.key === 'ArrowLeft') {
                focusElement(currentCell.previousElementSibling);
            }

            if (e.key === 'ArrowDown') {
                focusElement(currentRow.nextElementSibling?.children[cellIndex] || null);
            }

            if (e.key === 'ArrowUp') {
                focusElement(currentRow.previousElementSibling?.children[cellIndex] || null);
            }
        }
    };

    return {
        localData,
        setLocalData,
        loading,
        openCustomer,
        setOpenCustomer,
        handleUpdate,
        handleDelete,
        handleKeyDown,
        countRef,
        priceRef,
    };
}