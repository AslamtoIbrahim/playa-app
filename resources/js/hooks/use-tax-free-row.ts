// hooks/use-tax-free-row.ts
import { destroy, store, update } from '@/routes/differences';
import { Difference } from '@/types/difference';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface UseTaxFreeRowProps {
    diff?: Difference;
    maxAvailable: number;
    isNew?: boolean;
    invoiceItemId?: number;
    onSuccess?: (newDiff: Difference) => void;
    onDelete?: (id: number) => void;
}

export function useTaxFreeRow({
    diff,
    maxAvailable,
    isNew,
    invoiceItemId,
    onSuccess,
    onDelete,
}: UseTaxFreeRowProps) {
    const [loading, setLoading] = useState<boolean>(false);

    // FIX: Zdna ?. qbel toString() bach ila kan null mat-crashich
    const [data, setData] = useState({
        customer_id: diff?.customer_id?.toString() || '',
        item_id: diff?.item_id?.toString() || '',
        unit_count: diff?.unit_count?.toString() || '0',
        real_price: diff?.real_price?.toString() || '0',
        boxes: diff?.boxes?.toString() || '0',
    });

    const handleDataChange = (updates: Partial<typeof data>): void => {
        setData((prev) => ({ ...prev, ...updates }));
    };

    const submitSave = (currentData = data): void => {
        if (loading) return;

        const newCount = parseFloat(currentData.unit_count) || 0;
        
        // Validation sghira
        if (!isNew && diff && 
            newCount === Number(diff.unit_count) && 
            currentData.real_price === diff.real_price?.toString() &&
            currentData.boxes === diff.boxes?.toString()) {
            return; // Mat-sivich ila matbedel walou
        }

        setLoading(true);

        const payload = {
            invoice_item_id: diff?.invoice_item_id || invoiceItemId,
            customer_id: parseInt(currentData.customer_id),
            item_id: parseInt(currentData.item_id),
            unit_count: newCount,
            real_price: parseFloat(currentData.real_price) || 0,
            boxes: parseInt(currentData.boxes) || 0,
        };

        router.patch(update(diff!.id), payload, {
            preserveScroll: true,
            onSuccess: () => toast.success('Mis à jour'),
            onFinish: () => setLoading(false),
        });
    };

    const handleDelete = (): void => {
        if (!diff || loading) return;
        setLoading(true);
        router.delete(destroy(diff.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Supprimé');
                if (onDelete) onDelete(diff.id);
            },
            onFinish: () => setLoading(false),
        });
    };

    return {
        data,
        handleDataChange,
        loading,
        handleDelete,
        submitSave,
    };
}