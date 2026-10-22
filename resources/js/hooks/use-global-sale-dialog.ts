import {
    destroy as destroySaleItem,
    store as storeSaleItem,
    update as updateSaleItemRoute,
} from '@/routes/sale-items';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import type { Category } from '@/types/category';
import type { Item } from '@/types/item';
import type { Sale } from '@/types/sale';
import type { SaleItem } from '@/types/sale-item';
import { router } from '@inertiajs/react';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

interface GlobalSaleDraft {
    itemId: string;
    unitCount: string;
    salePrice: string;
    realPrice: string;
    isWithTax: boolean;
}

type SaleItemUpdate = Partial<
    Pick<
        SaleItem,
        | 'sale_id'
        | 'item_id'
        | 'sale_price'
        | 'unit_count'
        | 'real_price'
        | 'is_with_tax'
    >
>;

interface UseGlobalSaleDialogProps {
    onOpenChange: (open: boolean) => void;
    sale?: Sale;
    sales: Sale[];
    items: Item[];
    categories: Category[];
    invoiceCategoryIds: number[];
    categoryUnitById: Record<number, string>;
    availableStockByCategory: Record<number, number>;
}

const initialDraft: GlobalSaleDraft = {
    itemId: '',
    unitCount: '',
    salePrice: '',
    realPrice: '',
    isWithTax: false,
};

export function useGlobalSaleDialog({
    onOpenChange,
    sale,
    sales,
    items,
    categories,
    invoiceCategoryIds,
    categoryUnitById,
    availableStockByCategory,
}: UseGlobalSaleDialogProps) {
    const [draft, setDraft] = useState<GlobalSaleDraft>(initialDraft);
    const [itemSelectOpen, setItemSelectOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState(
        sale ? String(sale.id) : '',
    );
    const [saleSelectOpen, setSaleSelectOpen] = useState(false);
    const [articleIds, setArticleIds] = useState<Record<string, string>>({});
    const [clientIds, setClientIds] = useState<Record<string, string>>({});
    const [openArticleIds, setOpenArticleIds] = useState<
        Record<string, boolean>
    >({});
    const [openClientIds, setOpenClientIds] = useState<
        Record<string, boolean>
    >({});

    const selectedSale =
        sale ?? sales.find((candidate) => String(candidate.id) === selectedSaleId);
    const boatlessSaleItems = sales.flatMap((currentSale) =>
        (currentSale.items ?? []).filter(
            (line) => !line.deleted_at && !line.boat_id,
        ),
    );
    const selectedItem = items.find((item) => String(item.id) === draft.itemId);
    const realPrice = Number(draft.realPrice || 0);
    const salePrice = Number(draft.salePrice || 0);
    const remainingInvoiceCount = selectedItem
        ? availableStockByCategory[selectedItem.category_id]
        : undefined;
    const unitCount = Number(draft.unitCount || 0);
    const amount = Math.abs(unitCount) * realPrice;
    const tax = draft.isWithTax ? amount * 0.03 : 0;
    const totalDiff = (salePrice - realPrice) * Math.abs(unitCount);
    const exceedsInvoiceQuantity =
        remainingInvoiceCount !== undefined &&
        Math.abs(unitCount) > remainingInvoiceCount;
    const invoiceCategoryStock = invoiceCategoryIds.map((categoryId) => ({
        id: categoryId,
        name:
            categories.find((category) => category.id === categoryId)?.name ??
            `Catégorie ${categoryId}`,
        remaining: availableStockByCategory[categoryId] ?? 0,
        unit: categoryUnitById[categoryId] === 'kg' ? 'kg' : 'NC',
    }));

    const updateDraft = (updates: Partial<GlobalSaleDraft>): void => {
        setDraft((current) => ({ ...current, ...updates }));
    };

    const handleDialogOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen) {
            setDraft(initialDraft);

            if (!sale) {
                setSelectedSaleId('');
            }
        }

        onOpenChange(nextOpen);
    };

    /**
     * Resolve the stock error for a saved line update, if any.
     *
     * The current quantity of the line is already counted as sold, so it is
     * added back to the category stock as long as the line stays in the same
     * category.
     */
    const stockErrorMessage = (
        itemId: number,
        count: number,
        line: SaleItem,
    ): string | null => {
        const item = items.find((candidate) => candidate.id === itemId);

        if (!item) {
            return null;
        }

        const available = availableStockByCategory[item.category_id];

        if (available === undefined) {
            return null;
        }

        const lineItem = items.find(
            (candidate) => candidate.id === line.item_id,
        );
        const currentCount =
            lineItem?.category_id === item.category_id
                ? Math.abs(Number(line.unit_count))
                : 0;
        const allowedCount = Math.max(0, available + currentCount);

        if (Math.abs(count) > allowedCount + 0.00001) {
            return `Stock insuffisant pour ${item.name} : ${allowedCount} unité(s) disponible(s).`;
        }

        return null;
    };

    const updateSaleItem = (
        line: SaleItem,
        updates: SaleItemUpdate,
    ): Promise<boolean> =>
        new Promise((resolve) => {
            if (
                updates.item_id !== undefined ||
                updates.unit_count !== undefined
            ) {
                const message = stockErrorMessage(
                    updates.item_id ?? line.item_id,
                    Number(updates.unit_count ?? line.unit_count),
                    line,
                );

                if (message) {
                    toast.error(message, { duration: 6000 });
                    resolve(false);

                    return;
                }
            }

            let succeeded = false;

            router.patch(updateSaleItemRoute(line.id), updates, {
                preserveScroll: true,
                onSuccess: () => {
                    succeeded = true;
                    toast.success('Ligne de vente mise à jour.');
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ??
                            'Impossible de mettre à jour cette ligne.',
                    );
                },
                onFinish: () => resolve(succeeded),
            });
        });

    const deleteSaleItem = (line: SaleItem): void => {
        router.delete(destroySaleItem(line.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Ligne de vente supprimée.');
            },
            onError: () => {
                toast.error('Impossible de supprimer cette ligne.');
            },
        });
    };

    const handleSave = (): void => {
        if (!selectedSale) {
            toast.error('Veuillez choisir un client.');

            return;
        }

        if (!draft.itemId) {
            toast.error('Veuillez choisir un article.');

            return;
        }

        if (!draft.unitCount || !Number.isFinite(unitCount) || unitCount === 0) {
            toast.error('Veuillez saisir une quantité valide.');

            return;
        }

        if (!Number.isFinite(salePrice) || salePrice <= 0) {
            toast.error('Le prix de vente doit être supérieur à zéro.');

            return;
        }

        if (exceedsInvoiceQuantity) {
            toast.error(
                `Quantité supérieure au stock restant : ${remainingInvoiceCount}.`,
            );

            return;
        }

        router.post(
            storeSaleItem(),
            {
                sale_id: selectedSale.id,
                invoice_item_id: null,
                item_id: Number(draft.itemId),
                boat_id: null,
                unit_count: unitCount > 0 ? -unitCount : unitCount,
                sale_price: salePrice,
                real_price: realPrice,
                is_with_tax: draft.isWithTax,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Ligne de vente ajoutée.');
                    setDraft(initialDraft);

                    if (!sale) {
                        setSelectedSaleId('');
                    }
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ??
                            'Stock insuffisant ou données invalides.',
                        { duration: 6000 },
                    );
                },
            },
        );
    };

    const handleCellKeyDown = (
        event: KeyboardEvent<HTMLElement>,
        onClear?: () => void,
    ): void => {
        if (
            itemSelectOpen ||
            saleSelectOpen ||
            Object.values(openArticleIds).some(Boolean) ||
            Object.values(openClientIds).some(Boolean)
        ) {
            return;
        }

        if (
            onClear &&
            (event.key === 'Delete' || event.key === 'Backspace')
        ) {
            event.preventDefault();
            onClear();

            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            handleSave();

            return;
        }

        navigateToAdjacentCell(event);
    };

    return {
        amount,
        articleIds,
        boatlessSaleItems,
        clientIds,
        deleteSaleItem,
        draft,
        handleCellKeyDown,
        handleDialogOpenChange,
        invoiceCategoryStock,
        itemSelectOpen,
        openArticleIds,
        openClientIds,
        remainingInvoiceCount,
        saleSelectOpen,
        selectedSale,
        selectedSaleId,
        setArticleIds,
        setClientIds,
        setItemSelectOpen,
        setOpenArticleIds,
        setOpenClientIds,
        setSaleSelectOpen,
        setSelectedSaleId,
        tax,
        totalDiff,
        updateDraft,
        updateSaleItem,
    };
}
