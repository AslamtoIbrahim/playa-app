import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SearchSelect } from '@/components/search-select';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/types/category';
import type { Item } from '@/types/item';
import type { Sale } from '@/types/sale';
import type { Customer } from '@/types/customer';
import type { DailySession } from '@/types/daily-session';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';
import MissingDialogSale from '@/components/missing-dialog-sale';
import { useGlobalSaleDialog } from '@/hooks/use-global-sale-dialog';
import type {
    KeyboardEvent,
    MouseEvent,
} from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

const selectableFields = [
    'sale_id',
    'sale_price',
    'item_id',
    'unit_count',
    'real_price',
    'is_with_tax',
] as const;

type SelectableField = (typeof selectableFields)[number];

interface CellSelection {
    rowId: string;
    field: SelectableField;
    anchorId: string;
    anchorField: SelectableField;
}

interface FillDrag {
    rowId: string;
    field: SelectableField;
    targetRowId: string;
    targetField: SelectableField;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale?: Sale;
    sales?: Sale[];
    items: Item[];
    invoiceCatalogItems: Item[];
    categories: Category[];
    invoiceCategoryIds: number[];
    categoryUnitById: Record<number, string>;
    availableStockByCategory?: Record<number, number>;
    customers?: Customer[];
    session?: DailySession | null;
}

const categoryBadgeColors = [
    'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
    'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
    'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200',
    'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200',
    'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200',
    'border-lime-300 bg-lime-50 text-lime-800 dark:border-lime-800 dark:bg-lime-950/50 dark:text-lime-200',
];

const remainingCountFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
});

const numberInputValue = (value: number | string): string => {
    const number = Number(value);

    return Number.isFinite(number) ? String(number) : '';
};

const handleSavedRowKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();

        return;
    }

    navigateToAdjacentCell(event);
};

export function GlobalSaleDialog({
    open,
    onOpenChange,
    sale,
    sales = [],
    items,
    invoiceCatalogItems,
    categories,
    invoiceCategoryIds,
    categoryUnitById,
    availableStockByCategory = {},
    customers = [],
    session,
}: Props) {
    const {
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
    } = useGlobalSaleDialog({
        onOpenChange,
        sale,
        sales,
        items,
        categories,
        invoiceCategoryIds,
        categoryUnitById,
        availableStockByCategory,
    });

    const [cellSelection, setCellSelection] = useState<CellSelection | null>(
        null,
    );
    const fillDrag = useRef<FillDrag | null>(null);
    const hasRemainingInvoiceStock =
        invoiceCategoryStock.length === 0 ||
        invoiceCategoryStock.some((category) => category.remaining > 0);
    const rowIds = useMemo(
        () => [
            ...(hasRemainingInvoiceStock ? ['draft'] : []),
            ...boatlessSaleItems.map((line) => String(line.id)),
        ],
        [boatlessSaleItems, hasRemainingInvoiceStock],
    );

    const isFillHandleCell = (
        rowId: string,
        field: SelectableField,
    ): boolean => {
        if (!cellSelection) {
            return false;
        }

        const anchorRowIndex = rowIds.indexOf(cellSelection.anchorId);
        const selectedRowIndex = rowIds.indexOf(cellSelection.rowId);
        const anchorFieldIndex = selectableFields.indexOf(
            cellSelection.anchorField,
        );
        const selectedFieldIndex = selectableFields.indexOf(cellSelection.field);

        return (
            rowIds.indexOf(rowId) ===
                Math.max(anchorRowIndex, selectedRowIndex) &&
            selectableFields.indexOf(field) ===
                Math.max(anchorFieldIndex, selectedFieldIndex)
        );
    };

    const fillHandle = (rowId: string, field: SelectableField) => {
        if (!isFillHandleCell(rowId, field)) {
            return null;
        }

        return (
            <button
                type="button"
                aria-label="Recopier la valeur vers les cellules voisines"
                className="absolute right-0 bottom-0 z-30 size-2 cursor-crosshair rounded-full border border-white bg-blue-600 p-0 shadow-sm dark:border-neutral-900"
                onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    fillDrag.current = {
                        rowId: cellSelection?.anchorId ?? rowId,
                        field: cellSelection?.anchorField ?? field,
                        targetRowId: rowId,
                        targetField: field,
                    };
                }}
                onClick={(event) => event.stopPropagation()}
            />
        );
    };

    const cellProps = (rowId: string, field: SelectableField) => {
        const anchorIndex = cellSelection
            ? rowIds.indexOf(cellSelection.anchorId)
            : -1;
        const selectedIndex = cellSelection
            ? rowIds.indexOf(cellSelection.rowId)
            : -1;
        const rowIndex = rowIds.indexOf(rowId);
        const anchorFieldIndex = cellSelection
            ? selectableFields.indexOf(cellSelection.anchorField)
            : -1;
        const selectedFieldIndex = cellSelection
            ? selectableFields.indexOf(cellSelection.field)
            : -1;
        const fieldIndex = selectableFields.indexOf(field);
        const isSelected =
            anchorIndex >= 0 &&
            selectedIndex >= 0 &&
            rowIndex >= Math.min(anchorIndex, selectedIndex) &&
            rowIndex <= Math.max(anchorIndex, selectedIndex) &&
            fieldIndex >= Math.min(anchorFieldIndex, selectedFieldIndex) &&
            fieldIndex <= Math.max(anchorFieldIndex, selectedFieldIndex);
        const isFirstSelectedRow =
            rowIndex === Math.min(anchorIndex, selectedIndex);
        const isLastSelectedRow =
            rowIndex === Math.max(anchorIndex, selectedIndex);
        const isFirstSelectedField =
            fieldIndex === Math.min(anchorFieldIndex, selectedFieldIndex);
        const isLastSelectedField =
            fieldIndex === Math.max(anchorFieldIndex, selectedFieldIndex);
        const selectionShadows = [
            isFirstSelectedRow ? 'inset 0 2px rgb(59 130 246)' : '',
            isLastSelectedRow ? 'inset 0 -2px rgb(59 130 246)' : '',
            isFirstSelectedField ? 'inset 2px 0 rgb(59 130 246)' : '',
            isLastSelectedField ? 'inset -2px 0 rgb(59 130 246)' : '',
        ].filter(Boolean);

        return {
            'data-sale-cell': field,
            'data-sale-row': rowId,
            onMouseDownCapture: (event: MouseEvent<HTMLTableCellElement>) => {
                if (fillDrag.current) {
                    event.preventDefault();
                    event.stopPropagation();

                    return;
                }

                if (event.shiftKey) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                setCellSelection((current) => ({
                    rowId,
                    field,
                    anchorId:
                        event.shiftKey && current
                            ? current.anchorId
                            : rowId,
                    anchorField:
                        event.shiftKey && current
                            ? current.anchorField
                            : field,
                }));
            },
            onClickCapture: (event: MouseEvent<HTMLTableCellElement>) => {
                if (event.shiftKey) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            },
            onFocusCapture: () => {
                setCellSelection((current) =>
                    current?.rowId === rowId && current.field === field
                        ? current
                        : {
                              rowId,
                              field,
                              anchorId: rowId,
                              anchorField: field,
                          },
                );
            },
            style: isSelected
                ? {
                      position: 'relative' as const,
                      zIndex: 10,
                      backgroundColor: 'rgb(59 130 246 / 12%)',
                      boxShadow: selectionShadows.join(', '),
                  }
                : undefined,
        };
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setCellSelection(null);
        }

        handleDialogOpenChange(nextOpen);
    };

    useEffect(() => {
        const clearSelectionOutsideCells = (event: PointerEvent) => {
            if (
                event.target instanceof Element &&
                !event.target.closest('[data-sale-cell]')
            ) {
                setCellSelection(null);
            }
        };

        document.addEventListener('pointerdown', clearSelectionOutsideCells);

        return () => {
            document.removeEventListener(
                'pointerdown',
                clearSelectionOutsideCells,
            );
        };
    }, []);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const drag = fillDrag.current;

            if (!drag) {
                return;
            }

            const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>('[data-sale-cell][data-sale-row]');
            const targetRowId = target?.dataset.saleRow;
            const targetField = target?.dataset.saleCell as
                | SelectableField
                | undefined;

            if (!targetRowId || !targetField) {
                return;
            }

            const sourceRowIndex = rowIds.indexOf(drag.rowId);
            const targetRowIndex = rowIds.indexOf(targetRowId);
            const sourceFieldIndex = selectableFields.indexOf(drag.field);
            const targetFieldIndex = selectableFields.indexOf(targetField);
            const numericFields: SelectableField[] = [
                'sale_price',
                'unit_count',
                'real_price',
            ];
            const isVerticalFill =
                targetField === drag.field && sourceRowIndex !== targetRowIndex;
            const isHorizontalFill =
                targetRowId === drag.rowId &&
                numericFields.includes(drag.field) &&
                numericFields.includes(targetField) &&
                sourceFieldIndex !== targetFieldIndex;

            if (!isVerticalFill && !isHorizontalFill) {
                return;
            }

            drag.targetRowId = targetRowId;
            drag.targetField = targetField;
            setCellSelection({
                anchorId: drag.rowId,
                anchorField: drag.field,
                rowId: targetRowId,
                field: targetField,
            });
        };

        const handlePointerUp = () => {
            const drag = fillDrag.current;
            fillDrag.current = null;

            if (!drag) {
                return;
            }

            window.requestAnimationFrame(() => {
                const targetCell = document.querySelector<HTMLElement>(
                    'tr[data-sale-row="' +
                        drag.targetRowId +
                        '"] [data-sale-cell="' +
                        drag.targetField +
                        '"]',
                );
                const targetControl = targetCell?.querySelector<HTMLElement>(
                    'input, button, [role="combobox"], [role="checkbox"]',
                );

                targetControl?.dispatchEvent(
                    new KeyboardEvent('keydown', {
                        bubbles: true,
                        cancelable: true,
                        key: 'd',
                        ctrlKey: true,
                    }),
                );
            });
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [rowIds]);

    useEffect(() => {
        const handleGridKeyDown = (event: globalThis.KeyboardEvent) => {
            const target = event.target;
            const cell =
                target instanceof Element
                    ? target.closest<HTMLElement>('[data-sale-cell]')
                    : null;
            const table = document.querySelector('[data-global-sale-table]');
            const row = cell?.closest<HTMLTableRowElement>('tr[data-sale-row]');

            if (!cell || !table || !row) {
                return;
            }

            const rowId = row.dataset.saleRow;
            const field = cell.dataset.saleCell as SelectableField | undefined;

            if (!rowId || !field) {
                return;
            }

            const readValue = (
                sourceRowId: string,
                sourceField: SelectableField,
            ) => {
                if (sourceRowId === 'draft') {
                    if (sourceField === 'sale_id') {
                        return selectedSaleId;
                    }

                    if (sourceField === 'sale_price') {
                        return draft.salePrice;
                    }

                    if (sourceField === 'item_id') {
                        return draft.itemId;
                    }

                    if (sourceField === 'unit_count') {
                        return draft.unitCount;
                    }

                    if (sourceField === 'real_price') {
                        return draft.realPrice;
                    }

                    return draft.isWithTax;
                }

                const line = boatlessSaleItems.find(
                    (item) => String(item.id) === sourceRowId,
                );

                if (!line) {
                    return '';
                }

                if (sourceField === 'sale_id') {
                    return clientIds[sourceRowId] ?? String(line.sale_id);
                }

                if (sourceField === 'item_id') {
                    return articleIds[sourceRowId] ?? String(line.item_id);
                }

                const sourceCell = table.querySelector<HTMLElement>(
                    'tr[data-sale-row="' +
                        sourceRowId +
                        '"] [data-sale-cell="' +
                        sourceField +
                        '"]',
                );

                if (sourceField === 'is_with_tax') {
                    return (
                        sourceCell
                            ?.querySelector('[role="checkbox"]')
                            ?.getAttribute('data-state') === 'checked'
                    );
                }

                const input =
                    sourceCell?.querySelector<HTMLInputElement>('input');

                if (input) {
                    return input.value;
                }

                if (sourceField === 'sale_price') {
                    return String(line.sale_price);
                }

                if (sourceField === 'unit_count') {
                    return String(Math.abs(Number(line.unit_count)));
                }

                return String(line.real_price);
            };

            const applyValue = async (
                targetRowId: string,
                targetField: SelectableField,
                value: string | boolean,
            ) => {
                const textValue = String(value);

                if (targetRowId === 'draft') {
                    if (targetField === 'sale_id') {
                        setSelectedSaleId(textValue);
                    } else if (targetField === 'sale_price') {
                        updateDraft({ salePrice: textValue });
                    } else if (targetField === 'item_id') {
                        updateDraft({ itemId: textValue });
                    } else if (targetField === 'unit_count') {
                        updateDraft({ unitCount: textValue });
                    } else if (targetField === 'real_price') {
                        updateDraft({ realPrice: textValue });
                    } else {
                        updateDraft({ isWithTax: value === true });
                    }

                    return;
                }

                const line = boatlessSaleItems.find(
                    (item) => String(item.id) === targetRowId,
                );

                if (!line) {
                    return;
                }

                if (targetField === 'sale_id') {
                    const saleId = Number(value);
                    setClientIds((current) => ({
                        ...current,
                        [targetRowId]: textValue,
                    }));
                    await updateSaleItem(line, { sale_id: saleId });
                } else if (targetField === 'item_id') {
                    const itemId = Number(value);
                    setArticleIds((current) => ({
                        ...current,
                        [targetRowId]: textValue,
                    }));
                    await updateSaleItem(line, { item_id: itemId });
                } else if (targetField === 'sale_price') {
                    if (Number(value) > 0) {
                        await updateSaleItem(line, {
                            sale_price: Number(value),
                        });
                    }
                } else if (targetField === 'unit_count') {
                    if (Number(value) > 0) {
                        await updateSaleItem(line, {
                            unit_count: -Number(value),
                        });
                    }
                } else if (targetField === 'real_price') {
                    await updateSaleItem(line, {
                        real_price: Number(value),
                    });
                } else {
                    await updateSaleItem(line, {
                        is_with_tax: value === true,
                    });
                }

                const targetCell = table.querySelector<HTMLElement>(
                    'tr[data-sale-row="' +
                        targetRowId +
                        '"] [data-sale-cell="' +
                        targetField +
                        '"]',
                );
                const targetInput =
                    targetCell?.querySelector<HTMLInputElement>('input');

                if (targetInput) {
                    targetInput.value =
                        targetField === 'unit_count'
                            ? String(Math.abs(Number(value)))
                            : textValue;
                }
            };

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === 'd' &&
                cellSelection
            ) {
                event.preventDefault();
                event.stopPropagation();

                const anchorIndex = rowIds.indexOf(cellSelection.anchorId);
                const endIndex = rowIds.indexOf(cellSelection.rowId);

                if (anchorIndex < 0 || endIndex < 0) {
                    return;
                }

                const fillSelectedRows = async () => {
                    if (anchorIndex !== endIndex) {
                        const firstIndex = Math.min(anchorIndex, endIndex);
                        const lastIndex = Math.max(anchorIndex, endIndex);
                        const value = readValue(
                            rowIds[firstIndex],
                            cellSelection.field,
                        );

                        for (const targetRowId of rowIds.slice(
                            firstIndex + 1,
                            lastIndex + 1,
                        )) {
                            await applyValue(
                                targetRowId,
                                cellSelection.field,
                                value,
                            );
                        }

                        return;
                    }

                    const anchorFieldIndex = selectableFields.indexOf(
                        cellSelection.anchorField,
                    );
                    const endFieldIndex = selectableFields.indexOf(
                        cellSelection.field,
                    );
                    const firstFieldIndex = Math.min(
                        anchorFieldIndex,
                        endFieldIndex,
                    );
                    const lastFieldIndex = Math.max(
                        anchorFieldIndex,
                        endFieldIndex,
                    );
                    const value = readValue(
                        cellSelection.anchorId,
                        cellSelection.anchorField,
                    );

                    for (const targetField of selectableFields.slice(
                        firstFieldIndex + 1,
                        lastFieldIndex + 1,
                    )) {
                        await applyValue(rowIds[anchorIndex], targetField, value);
                    }
                };

                void fillSelectedRows();

                return;
            }

            if (
                !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
                    event.key,
                )
            ) {
                return;
            }

            let nextRowIndex = rowIds.indexOf(rowId);
            let nextFieldIndex = selectableFields.indexOf(field);

            if (event.key === 'ArrowUp') {
                nextRowIndex -= 1;
            } else if (event.key === 'ArrowDown') {
                nextRowIndex += 1;
            } else if (event.key === 'ArrowLeft') {
                nextFieldIndex -= 1;
            } else {
                nextFieldIndex += 1;
            }

            while (
                rowIds[nextRowIndex] &&
                nextFieldIndex >= 0 &&
                nextFieldIndex < selectableFields.length
            ) {
                const nextRowId = rowIds[nextRowIndex];
                const nextField = selectableFields[nextFieldIndex];
                const nextCell = table.querySelector<HTMLElement>(
                    'tr[data-sale-row="' +
                        nextRowId +
                        '"] [data-sale-cell="' +
                        nextField +
                        '"]',
                );

                if (nextCell) {
                    event.preventDefault();
                    event.stopPropagation();
                    setCellSelection((current) => ({
                        rowId: nextRowId,
                        field: nextField,
                        anchorId: event.shiftKey
                            ? (current?.anchorId ?? rowId)
                            : nextRowId,
                        anchorField: event.shiftKey
                            ? (current?.anchorField ?? field)
                            : nextField,
                    }));
                    const nextControl = nextCell.querySelector<
                        HTMLInputElement | HTMLButtonElement
                    >('input, button, [role="combobox"], [role="checkbox"]');

                    nextControl?.focus();

                    if (nextControl instanceof HTMLInputElement) {
                        nextControl.select();
                    }

                    return;
                }

                if (event.key === 'ArrowUp') {
                    nextRowIndex -= 1;
                } else if (event.key === 'ArrowDown') {
                    nextRowIndex += 1;
                } else if (event.key === 'ArrowLeft') {
                    nextFieldIndex -= 1;
                } else {
                    nextFieldIndex += 1;
                }
            }
        };

        window.addEventListener('keydown', handleGridKeyDown, true);

        return () =>
            window.removeEventListener('keydown', handleGridKeyDown, true);
    }, [
        articleIds,
        boatlessSaleItems,
        cellSelection,
        clientIds,
        draft,
        rowIds,
        selectedSaleId,
        setArticleIds,
        setClientIds,
        setSelectedSaleId,
        updateDraft,
        updateSaleItem,
    ]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[88vh] w-11/12 max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-amber-100 p-0 shadow-2xl sm:max-w-5xl dark:border-amber-950 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader className="shrink-0 border-b border-amber-200 bg-linear-to-br from-amber-50 via-white to-yellow-50 p-3 pr-12 text-left dark:border-amber-950 dark:from-amber-950/50 dark:via-neutral-950 dark:to-yellow-950/30">
                    <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 truncate pt-1 text-[10px] font-bold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-300">
                            {'Vente \u00b7 '}
                            {selectedSale?.customer?.name ?? (selectedSale ? `Vente #${selectedSale.id}` : 'Choisissez une vente')}
                        </div>
                        {invoiceCategoryStock.length > 0 && (
                            <div
                                aria-label="Stock restant par catégorie"
                                role="group"
                                className="flex max-w-2/3 shrink-0 flex-wrap justify-end gap-1"
                            >
                                {invoiceCategoryStock.map((category) => (
                                    <Badge
                                        key={category.id}
                                        variant="outline"
                                        className={cn(
                                            'h-6 gap-1 px-1.5 text-[10px] font-medium shadow-sm',
                                            category.remaining === 0
                                                ? 'animate-pulse border-red-400 bg-red-50 text-red-700 motion-reduce:animate-none dark:border-red-700 dark:bg-red-950/60 dark:text-red-300'
                                                : categoryBadgeColors[
                                                      category.id %
                                                          categoryBadgeColors.length
                                                  ],
                                        )}
                                    >
                                        <span className="max-w-24 truncate">
                                            {category.name}:
                                        </span>
                                        <span className="font-bold tabular-nums">
                                            {remainingCountFormatter.format(category.remaining)}{' '}
                                            {category.unit}
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-neutral-100">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20"><ShoppingCart className="size-4" /></span>
                        Vente globale · Articles avec ou sans bateau
                    </DialogTitle>
                    <DialogDescription className="pl-12 text-xs text-slate-500 dark:text-neutral-400">
                        Règle : la quantité vendue ne doit pas dépasser le stock restant de cette catégorie pour la journée.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-auto bg-slate-50/60 p-3 dark:bg-neutral-950">
                    <Table
                        data-global-sale-table
                        className="w-auto min-w-212.5 border-collapse"
                    >
                        <TableHeader className="sticky top-0 z-20 bg-slate-50/80 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="min-w-40 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Prix vente
                                </TableHead>
                                <TableHead className="min-w-40 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Article
                                </TableHead>
                                <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    {'Quantit\u00e9'}
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    {'Prix r\u00e9el'}
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Montant
                                </TableHead>
                                <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Taxe 3%
                                </TableHead>
                                <TableHead className="w-20 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Avec taxe
                                </TableHead>
                                <TableHead className="w-28 py-4 text-center text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Total diff
                                </TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow
                                data-sale-row="draft"
                                hidden={!hasRemainingInvoiceStock}
                                className="group h-10 min-h-10 border-b border-amber-200 bg-amber-50/70 transition-colors hover:bg-amber-100/70 dark:border-amber-900 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
                            >
                                <TableCell
                                    {...(!sale ? cellProps('draft', 'sale_id') : {})}
                                    className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800"
                                >
                                    {sale ? (
                                        <span className="block truncate px-3 font-medium text-slate-900 dark:text-neutral-100">
                                            {sale.customer?.name ?? `Vente #${sale.id}`}
                                        </span>
                                    ) : (
                                        <>
                                            {fillHandle('draft', 'sale_id')}
                                            <SearchSelect
                                                value={selectedSaleId}
                                                options={sales.map((option) => ({
                                                    id: option.id,
                                                    name: option.customer?.name ?? `Vente #${option.id}`,
                                                }))}
                                                placeholder="Client..."
                                                emptyMessage="Aucun client trouvé."
                                                renderNoMatchAction={(search) => session ? (
                                                    <MissingDialogSale
                                                        sessionId={session.id}
                                                        sessionDate={session.session_date}
                                                        customers={customers}
                                                        initialCustomerName={search}
                                                        trigger={<Button type="button" variant="outline" size="sm" aria-label="Créer un client et une vente"><Plus className="size-4" /></Button>}
                                                    />
                                                ) : null}
                                                open={saleSelectOpen}
                                                onOpenChange={setSaleSelectOpen}
                                                onSelect={(id) => setSelectedSaleId(String(id))}
                                                onKeyDown={(event) =>
                                                    handleCellKeyDown(event, () =>
                                                        setSelectedSaleId(''),
                                                    )
                                                }
                                                className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                            />
                                        </>
                                    )}
                                </TableCell>
                                <TableCell {...cellProps('draft', 'sale_price')} className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    {fillHandle('draft', 'sale_price')}
                                    <Input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        value={draft.salePrice}
                                        placeholder="0"
                                        onChange={(event) => updateDraft({ salePrice: event.target.value })}
                                        onKeyDown={handleCellKeyDown}
                                        className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        aria-label="Prix de vente"
                                    />
                                </TableCell>
                                <TableCell {...cellProps('draft', 'item_id')} className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    {fillHandle('draft', 'item_id')}
                                    <SearchSelect
                                        value={draft.itemId}
                                        options={invoiceCatalogItems.map((item) => ({
                                            id: item.id,
                                            name: item.name,
                                        }))}
                                        placeholder="Article…"
                                        emptyMessage="Aucun article trouvé."
                                        open={itemSelectOpen}
                                        onOpenChange={setItemSelectOpen}
                                        onSelect={(id) =>
                                            updateDraft({
                                                itemId: String(id),
                                            })
                                        }
                                        onKeyDown={(event) =>
                                            handleCellKeyDown(event, () =>
                                                updateDraft({ itemId: '' }),
                                            )
                                        }
                                        className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                    />
                                </TableCell>
                                <TableCell {...cellProps('draft', 'unit_count')} className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    {fillHandle('draft', 'unit_count')}
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={draft.unitCount}
                                        placeholder="0"
                                        max={remainingInvoiceCount}
                                        onChange={(event) =>
                                            updateDraft({
                                                unitCount: event.target.value,
                                            })
                                        }
                                        onKeyDown={handleCellKeyDown}
                                        className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        aria-label="Quantit\u00e9 vendue"
                                    />
                                </TableCell>
                                <TableCell {...cellProps('draft', 'real_price')} className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                    {fillHandle('draft', 'real_price')}
                                    <Input
                                        type="number"
                                        step="any"
                                        value={draft.realPrice}
                                        placeholder="0"
                                        onChange={(event) =>
                                            updateDraft({
                                                realPrice: event.target.value,
                                            })
                                        }
                                        onKeyDown={handleCellKeyDown}
                                        className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        aria-label="Prix r\u00e9el"
                                    />
                                </TableCell>
                                <TableCell className="w-28 border-r border-slate-100 px-3 py-0 text-right text-xs font-bold tabular-nums text-slate-700 dark:border-neutral-800 dark:text-neutral-300">
                                    {amount.toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="w-20 border-r border-slate-100 px-3 py-0 text-right text-xs tabular-nums text-slate-600 dark:border-neutral-800 dark:text-neutral-400">
                                    {tax.toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell {...cellProps('draft', 'is_with_tax')} className="w-20 border-r border-slate-100 text-center dark:border-neutral-800">
                                    {fillHandle('draft', 'is_with_tax')}
                                    <Checkbox
                                        checked={draft.isWithTax}
                                        onCheckedChange={(checked) =>
                                            updateDraft({ isWithTax: checked === true })
                                        }
                                        aria-label="Vendre avec taxe"
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Delete' ||
                                                event.key === 'Backspace'
                                            ) {
                                                event.preventDefault();
                                                updateDraft({ isWithTax: false });

                                                return;
                                            }

                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                event.currentTarget.click();

                                                return;
                                            }

                                            navigateToAdjacentCell(event);
                                        }}
                                    />
                                </TableCell>
                                <TableCell className={cn('w-28 px-3 py-0 text-right text-xs font-bold tabular-nums', totalDiff < 0 ? 'text-rose-600 dark:text-rose-400' : totalDiff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-neutral-300')}>
                                    {totalDiff.toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="w-12" />
                            </TableRow>
                            {boatlessSaleItems.map((line) => (
                                <TableRow data-sale-row={line.id} key={line.id} className="group h-10 border-b border-slate-100 dark:border-neutral-800">
                                    <TableCell {...cellProps(String(line.id), 'sale_id')} className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        {fillHandle(String(line.id), 'sale_id')}
                                        <SearchSelect value={clientIds[String(line.id)] ?? String(line.sale_id)} options={sales.map((option) => ({ id: option.id, name: option.customer?.name ?? `Vente #${option.id}` }))} placeholder="Client..." emptyMessage="Aucun client trouvé." open={openClientIds[String(line.id)] ?? false} onOpenChange={(open) => setOpenClientIds((state) => ({ ...state, [String(line.id)]: open }))} onKeyDown={(event) => handleCellKeyDown(event, () => setClientIds((state) => ({ ...state, [String(line.id)]: '' })))} onSelect={(id) => {
                                            setClientIds((state) => ({ ...state, [String(line.id)]: String(id) }));
                                            updateSaleItem(line, { sale_id: Number(id) });
                                        }} className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800" />
                                    </TableCell>
                                    <TableCell {...cellProps(String(line.id), 'sale_price')} className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        {fillHandle(String(line.id), 'sale_price')}
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            defaultValue={numberInputValue(line.sale_price)}
                                            onBlur={(event) => {
                                                const price = Number(event.target.value);

                                                if (price > 0) {
                                                    updateSaleItem(line, {
                                                        sale_price: price,
                                                    });
                                                }
                                            }}
                                            onKeyDown={handleSavedRowKeyDown}
                                            className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            aria-label="Prix de vente"
                                        />
                                    </TableCell>
                                    <TableCell {...cellProps(String(line.id), 'item_id')} className="min-w-40 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        {fillHandle(String(line.id), 'item_id')}
                                        <SearchSelect
                                            value={articleIds[String(line.id)] ?? String(line.item_id)}
                                            options={items.map((item) => ({ id: item.id, name: item.name }))}
                                            placeholder="Article..."
                                            emptyMessage="Aucun article trouvé."
                                            open={openArticleIds[String(line.id)] ?? false}
                                            onOpenChange={(open) => setOpenArticleIds((state) => ({ ...state, [String(line.id)]: open }))}
                                            onKeyDown={(event) =>
                                                handleCellKeyDown(event, () =>
                                                    setArticleIds((state) => ({
                                                        ...state,
                                                        [String(line.id)]: '',
                                                    })),
                                                )
                                            }
                                            onSelect={(id) => {
                                                const itemId = Number(id);
                                                setArticleIds((state) => ({ ...state, [String(line.id)]: String(itemId) }));
                                                updateSaleItem(line, { item_id: itemId });
                                            }}
                                            className="h-10 w-full border-none bg-transparent px-3 font-medium text-slate-900 shadow-none capitalize focus-visible:bg-slate-100 focus-visible:ring-0 dark:text-neutral-100 dark:focus-visible:bg-neutral-800"
                                        />
                                    </TableCell>
                                    <TableCell {...cellProps(String(line.id), 'unit_count')} className="w-20 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        {fillHandle(String(line.id), 'unit_count')}
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            defaultValue={numberInputValue(Math.abs(Number(line.unit_count)))}
                                            onBlur={(event) => {
                                                const count = Number(event.target.value);

                                                if (count > 0) {
                                                    updateSaleItem(line, {
                                                        unit_count: -count,
                                                    });
                                                }
                                            }}
                                            onKeyDown={handleSavedRowKeyDown}
                                            className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            aria-label="Quantité vendue"
                                        />
                                    </TableCell>
                                    <TableCell {...cellProps(String(line.id), 'real_price')} className="w-28 border-r border-slate-100 p-0 dark:border-neutral-800">
                                        {fillHandle(String(line.id), 'real_price')}
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            defaultValue={numberInputValue(line.real_price)}
                                            onBlur={(event) => {
                                                updateSaleItem(line, {
                                                    real_price: Number(event.target.value),
                                                });
                                            }}
                                            onKeyDown={handleSavedRowKeyDown}
                                            className="h-10 border-none bg-transparent text-center [appearance:textfield] focus-visible:bg-slate-100 focus-visible:ring-0 dark:focus-visible:bg-neutral-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            aria-label="Prix réel"
                                        />
                                    </TableCell>
                                    <TableCell className="w-28 border-r border-slate-100 px-3 text-right dark:border-neutral-800">
                                        {Math.abs(Number(line.amount)).toLocaleString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="w-20 border-r border-slate-100 px-3 text-right dark:border-neutral-800">
                                        {Math.abs(Number(line.tax)).toLocaleString('fr-FR')}
                                    </TableCell>
                                    <TableCell {...cellProps(String(line.id), 'is_with_tax')} className="w-20 border-r border-slate-100 text-center dark:border-neutral-800">
                                        {fillHandle(String(line.id), 'is_with_tax')}
                                        <Checkbox
                                            checked={line.is_with_tax}
                                            onCheckedChange={(checked) => {
                                                updateSaleItem(line, {
                                                    is_with_tax: checked === true,
                                                });
                                            }}
                                            aria-label="Vendre avec taxe"
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === 'Delete' ||
                                                    event.key === 'Backspace'
                                                ) {
                                                    event.preventDefault();
                                                    updateSaleItem(line, {
                                                        is_with_tax: false,
                                                    });
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="w-28 px-3 text-right">
                                        {Number(line.total_diff ?? 0).toLocaleString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="w-12 p-0 text-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-10 text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                                            aria-label="Supprimer la ligne de vente"
                                            onPointerDown={(event) => event.stopPropagation()}
                                            onClick={() => {
                                                deleteSaleItem(line);
                                            }}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
