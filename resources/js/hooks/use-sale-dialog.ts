import type { InvoiceItem } from '@/types/invoice-item';
import type { Sale } from '@/types/sale';
import type { SaleItem } from '@/types/sale-item';
import { router } from '@inertiajs/react';
import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSaleCellSelection } from '@/hooks/use-sale-cell-selection';

interface UseSaleDialogProps {
    items: InvoiceItem[];
    sales: Sale[];
    availableStockByCategory: Record<number, number>;
    onOpenChange: (open: boolean) => void;
}

export function useSaleDialog({
    items,
    sales,
    availableStockByCategory,
    onOpenChange,
}: UseSaleDialogProps) {
    const [saleIds, setSaleIds] = useState<Record<string, string>>({});
    const [counts, setCounts] = useState<Record<string, string>>({});
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [realPrices, setRealPrices] = useState<Record<string, string>>({});
    const [taxFlags, setTaxFlags] = useState<Record<string, boolean>>({});
    const [openSaleIds, setOpenSaleIds] = useState<Record<string, boolean>>({});
    const [itemIds, setItemIds] = useState<Record<string, string>>({});
    const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({});
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const saleOptions = sales.map((sale) => ({
        id: sale.id,
        name: sale.customer?.name ?? `Vente #${sale.id}`,
    }));

    const remaining = (item: InvoiceItem): number =>
        Math.max(
            0,
            Number(item.unit_count) -
                (item.sale_items ?? [])
                    .filter((saleItem) => !saleItem.deleted_at)
                    .reduce(
                        (sum, saleItem) =>
                            sum + Math.abs(Number(saleItem.unit_count)),
                        0,
                    ),
        );

    const defaultRealPrice = (item: InvoiceItem): number =>
        Number(item.differences?.[0]?.real_price ?? item.unit_price);

    const defaultSalePrice = (item: InvoiceItem): number =>
        item.differences?.length
            ? defaultRealPrice(item)
            : Number(item.unit_price);

    const sellableItems = items.filter(
        (item) =>
            remaining(item) > 0 &&
            (availableStockByCategory[item.category_id] ?? remaining(item)) >
                0,
    );
    const savedSaleRows = items.flatMap((item) =>
        (item.sale_items ?? [])
            .filter((line) => !line.deleted_at)
            .map((line) => ({ item, line })),
    );
    const {
        fillSelectedCells,
        isCellInRange,
        selectCellRange,
        suppressCellClick,
    } = useSaleCellSelection(sellableItems);
    const {
        fillSelectedCells: fillSavedCells,
        isCellInRange: isSavedCellInRange,
        selectCellRange: selectSavedCellRange,
        suppressCellClick: suppressSavedCellClick,
    } = useSaleCellSelection(savedSaleRows.map(({ item }) => item));

    const save = (
        item: InvoiceItem,
        line?: SaleItem,
        selectedSaleId?: number,
        selectedItemId?: number,
        selectedSalePrice?: number,
    ): void => {
        const key = line ? `sale-${line.id}` : `item-${item.id}`;
        const categoryAvailable = availableStockByCategory[item.category_id];
        const maxCount =
            categoryAvailable === undefined
                ? remaining(item)
                : categoryAvailable +
                  (line ? Math.abs(Number(line.unit_count)) : 0);
        const count = Number(
            counts[key] ??
                (line
                    ? Math.abs(Number(line.unit_count))
                    : Math.min(remaining(item), maxCount)),
        );
        const salePrice =
            selectedSalePrice ??
            Number(prices[key] ?? line?.sale_price ?? defaultSalePrice(item));
        const realPrice = Number(
            realPrices[key] ?? line?.real_price ?? defaultRealPrice(item),
        );

        const saleId = selectedSaleId ?? Number(saleIds[key] ?? line?.sale_id);
        const articleId =
            selectedItemId ??
            (itemIds[key] ? Number(itemIds[key]) : line?.item_id);

        if (count > maxCount + 0.00001) {
            toast.error(
                `La quantité dépasse le reste disponible de cette catégorie (${maxCount}).`,
            );

            return;
        }

        if (!saleId || !count || !articleId) {
            toast.error(
                'Choisissez une vente, un article et une quantit\u00e9.',
            );

            return;
        }

        const payload = {
            sale_id: saleId,
            invoice_item_id: item.id,
            item_id: articleId,
            boat_id: item.boat_id,
            unit_count: count > 0 ? -count : count,
            sale_price: salePrice,
            real_price: realPrice,
            is_with_tax: taxFlags[key] ?? line?.is_with_tax ?? false,
        };
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (!line) {
                    setSaleIds((current) => {
                        const next = { ...current };
                        delete next[key];

                        return next;
                    });
                    setCounts((current) => {
                        const next = { ...current };
                        delete next[key];

                        return next;
                    });
                    setPrices((current) => {
                        const next = { ...current };
                        delete next[key];

                        return next;
                    });
                    setRealPrices((current) => {
                        const next = { ...current };
                        delete next[key];

                        return next;
                    });
                    setTaxFlags((current) => {
                        const next = { ...current };
                        delete next[key];

                        return next;
                    });
                }

                toast.success(
                    line
                        ? 'Ligne de vente mise à jour.'
                        : 'Ligne de vente enregistrée.',
                );
            },
            onError: (errors: Record<string, string>) => {
                toast.error(
                    Object.values(errors)[0] ??
                        'Stock insuffisant ou donn\u00e9es invalides.',
                    { duration: 6000 },
                );
            },
        };

        if (line) {
            router.patch(`/sale-items/${line.id}`, payload, options);
        } else {
            router.post('/sale-items', payload, options);
        }
    };

    const fillSavedSelection = (
        event: KeyboardEvent<HTMLElement>,
        column: 'client' | 'salePrice' | 'article',
        rowIndex: number,
        setValues: Dispatch<SetStateAction<Record<string, string>>>,
        getValue: (item: InvoiceItem, rowIndex: number) => string,
        isTargetAllowed?: (
            item: InvoiceItem,
            sourceItem: InvoiceItem,
            targetIndex: number,
            sourceIndex: number,
        ) => boolean,
    ): void => {
        fillSavedCells(
            event,
            column,
            rowIndex,
            setValues,
            getValue,
            isTargetAllowed,
            (_item, index) => `sale-${savedSaleRows[index].line.id}`,
            (targetIndexes, value) => {
                targetIndexes.forEach((index) => {
                    const { item: targetItem, line } = savedSaleRows[index];

                    if (column === 'client') {
                        save(targetItem, line, Number(value));
                    } else if (column === 'article') {
                        save(targetItem, line, undefined, Number(value));
                    } else {
                        save(
                            targetItem,
                            line,
                            undefined,
                            undefined,
                            Number(value),
                        );
                    }
                });
            },
        );
    };

    const deleteAllSavedLines = (): void => {
        const savedLineIds = savedSaleRows.map(({ line }) => line.id);

        if (savedLineIds.length === 0) {
            return;
        }

        router.delete('/sale-items', {
            data: { ids: savedLineIds },
            preserveScroll: true,
            onSuccess: () => {
                setIsBulkDeleteOpen(false);
                toast.success('Lignes de vente supprimées.');
            },
            onError: () => {
                toast.error(
                    'Impossible de supprimer les lignes sélectionnées.',
                );
            },
        });
    };

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen) {
            sellableItems.forEach((item) => {
                const key = `item-${item.id}`;
                const count =
                    counts[key] ??
                    String(
                        Math.min(
                            remaining(item),
                            availableStockByCategory[item.category_id] ??
                                remaining(item),
                        ),
                    );
                const salePrice = prices[key] ?? String(defaultSalePrice(item));
                const realPrice =
                    realPrices[key] ?? String(defaultRealPrice(item));
                const hasCompleteValues =
                    Boolean(saleIds[key] && itemIds[key]) &&
                    count.trim() !== '' &&
                    salePrice.trim() !== '' &&
                    realPrice.trim() !== '' &&
                    Number.isFinite(Number(count)) &&
                    Number(count) > 0 &&
                    Number.isFinite(Number(salePrice)) &&
                    Number.isFinite(Number(realPrice));

                if (hasCompleteValues) {
                    save(item);
                }
            });
        }

        onOpenChange(nextOpen);
    };

    return {
        counts,
        defaultRealPrice,
        defaultSalePrice,
        deleteAllSavedLines,
        fillSavedSelection,
        fillSelectedCells,
        handleOpenChange,
        isBulkDeleteOpen,
        isCellInRange,
        isSavedCellInRange,
        itemIds,
        openItemIds,
        openSaleIds,
        prices,
        realPrices,
        remaining,
        saleIds,
        saleOptions,
        savedSaleRows,
        save,
        selectCellRange,
        selectSavedCellRange,
        sellableItems,
        setCounts,
        setIsBulkDeleteOpen,
        setItemIds,
        setOpenItemIds,
        setOpenSaleIds,
        setPrices,
        setRealPrices,
        setSaleIds,
        setTaxFlags,
        suppressCellClick,
        suppressSavedCellClick,
        taxFlags,
    };
}
