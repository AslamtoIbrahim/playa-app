import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Camera,
    Copy,
    Printer,
    ShoppingCart,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// UI Components
import { DeleteInvoiceItemsDialog } from '@/components/delete-invoice-items-dialog';
import InvoiceItemDragOverlay from '@/components/invoice-item-drag-overlay';
import InvoiceItemRow, {
    NEW_INVOICE_ITEM_ROW_ID,
} from '@/components/invoice-item-row';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// New Extracted Components & Hooks
import { InvoiceHeader } from '@/components/invoice-header';
import { InvoiceStatsGrid } from '@/components/invoice-stats-grid';
import { useInvoiceCalculations } from '@/hooks/use-invoice-calculations';
import {
    InvoiceColumnFilter,
    InvoiceColumnTotals,
    InvoiceGlobalSearch,
} from '@/components/invoice-item-filters';
import { useInvoiceItemFilters } from '@/hooks/use-invoice-item-filters';
import { useInvoiceCellSelection } from '@/hooks/use-invoice-cell-selection';
import { InvoiceSelectionStatistics } from '@/components/invoice-selection-statistics';

// Types & Routes
import { DifferenceDialog } from '@/components/difference-dialog';
import { GlobalSaleDialog } from '@/components/global-sale-dialog';
import { SaleDialog } from '@/components/sale-dialog';
import { ExportDropdown } from '@/components/export-dropdown';
import { ImportItemsDialog } from '@/components/import-items-dialog';
import { InvoicePrintFooter } from '@/components/print-invoice-footer';
import { useInvoiceExport } from '@/hooks/use-invoice-export';
import { useInvoiceImport } from '@/hooks/use-invoice-import';
import { useScreenshot } from '@/hooks/use-screenshot';
import AppLayout from '@/layouts/app-layout';
import { invoices } from '@/routes';
import {
    bulkStore,
    destroy,
    destroyMany,
    duplicateMany,
    reorder,
} from '@/routes/invoices/items';
import { Boat, Owner } from '@/types/boat';
import { Category } from '@/types/category';
import { Customer } from '@/types/customer';
import { Invoice } from '@/types/invoice';
import { InvoiceItem } from '@/types/invoice-item';
import { Item } from '@/types/item';
import { Sale } from '@/types/sale';
import type { DailySession } from '@/types/daily-session';
import { toast } from 'sonner';

interface Props {
    invoice: Invoice & { items: InvoiceItem[] };
    boats: Boat[];
    items: Item[];
    owners: Owner[];
    categories: Category[];
    customers: Customer[];
    /** Ventes de la même journée : seules cibles possibles pour une vente. */
    sales: Sale[];
    availableStockByCategory: Record<number, number>;
    globalSoldCountByInvoiceItem: Record<number, number>;
    /** Session courante (via sa zone) pour créer la vente manquante. */
    session: DailySession | null;
    /** URL de retour explicite fournie par le backend (journée liée ou liste). */
    backUrl: string;
}

/**
 * Row ids in display order: the unsaved row is always rendered first, then
 * the saved rows. Cell selection and fill share this index space so the new
 * row behaves like the saved ones.
 */
const getRowIds = (items: InvoiceItem[]): number[] => [
    NEW_INVOICE_ITEM_ROW_ID,
    ...items.map((item) => item.id),
];

export default function InvoiceShow({
    invoice,
    boats,
    items,
    owners,
    categories,
    customers,
    sales,
    availableStockByCategory,
    globalSoldCountByInvoiceItem,
    session,
    backUrl,
}: Props) {
    // --- State Management (Manual Synchronization) ---
    const [localItems, setLocalItems] = useState<InvoiceItem[]>(
        invoice.items || [],
    );
    const [prevItems, setPrevItems] = useState(invoice.items);

    const { exportToExcel, exportToCSV, exportToPDF } = useInvoiceExport();
    const { copyToClipboard } = useScreenshot();

    // State لـ Difference Dialog
    const [diffItem, setDiffItem] = useState<InvoiceItem | null>(null);
    const [isDiffOpen, setIsDiffOpen] = useState(false);

    // State لـ Sale Dialog (Vente) : les lignes de facture à vendre
    const [saleItemIds, setSaleItemIds] = useState<number[]>([]);
    const [isSaleOpen, setIsSaleOpen] = useState(false);
    const [isGlobalSaleOpen, setIsGlobalSaleOpen] = useState(false);

    // فـ Show.tsx
    if (invoice.items !== prevItems) {
        setPrevItems(invoice.items);
        setLocalItems(invoice.items);

        // هاد السطور هما اللي غيخليو الـ Dialog يزيد الـ Rows فالبلاصة
        if (isDiffOpen && diffItem) {
            const freshItem = invoice.items.find((i) => i.id === diffItem.id);

            if (freshItem) {
                setDiffItem(freshItem);
            }
        }
    }

    /**
     * Lignes de facture affichées dans le dialogue de vente, toujours
     * rafraîchies depuis les props Inertia : après chaque vente, les lignes
     * déjà vendues et le restant se mettent à jour sans refermer le dialogue.
     */
    const saleItems = saleItemIds
        .map((id) => invoice.items?.find((item) => item.id === id))
        .filter((item): item is InvoiceItem => Boolean(item));

    const invoiceCategoryIds = new Set(
        invoice.items.map((item) => item.category_id),
    );
    const categoryUnitById = invoice.items.reduce<Record<number, string>>(
        (unitsByCategory, item) => {
            if (!unitsByCategory[item.category_id]) {
                unitsByCategory[item.category_id] = item.unit;
            }

            return unitsByCategory;
        },
        {},
    );
    const invoiceCatalogItems = items.filter((item) =>
        invoiceCategoryIds.has(item.category_id),
    );

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const {
        filters,
        setFilters,
        filteredItems,
        activeFilterCount,
        clearColumnFilters,
    } = useInvoiceItemFilters(localItems);

    const toggleColumnFilters = () => {
        if (showColumnFilters) {
            clearColumnFilters();
            setShowColumnFilters(false);

            return;
        }

        setShowColumnFilters(true);
    };
    /**
     * Lignes ciblées par la suppression en cours : sélection multiple ou
     * ligne unique (menu de ligne). `single` détermine la route utilisée.
     */
    const [deleteTarget, setDeleteTarget] = useState<{
        ids: number[];
        single: boolean;
    } | null>(null);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const {
        selection: cellSelection,
        setSelection: setCellSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics: selectionStatistics,
        rowIds,
    } = useInvoiceCellSelection(localItems);
    const fillDrag = useRef<{
        rowId: number;
        field: string;
        value: string;
        targetId: number;
    } | null>(null);
    const cellSelectDrag = useRef<{
        rowId: number;
        field: string;
    } | null>(null);

    useEffect(() => {
        const clearCellSelectionOutsideTable = (event: PointerEvent) => {
            const target = event.target;

            if (
                target instanceof Element &&
                !target.closest(
                    '[data-invoice-cell], [data-invoice-selection-statistics]',
                )
            ) {
                setCellSelection(null);
            }
        };

        document.addEventListener(
            'pointerdown',
            clearCellSelectionOutsideTable,
        );

        return () => {
            document.removeEventListener(
                'pointerdown',
                clearCellSelectionOutsideTable,
            );
        };
    }, [setCellSelection]);

    const handleFillStart = (rowId: number, field: string, value: string) => {
        fillDrag.current = { rowId, field, value, targetId: rowId };
    };

    const handleCellSelect = (
        rowId: number,
        field: string,
        value: string,
        shift: boolean,
    ) => {
        selectCell(rowId, field, value, shift);
        cellSelectDrag.current = shift ? null : { rowId, field };
    };

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            if (!fillDrag.current) {
                const drag = cellSelectDrag.current;

                if (drag?.field === 'unit') {
                    window.dispatchEvent(
                        new Event('invoice-close-unit-select'),
                    );
                }

                const target = document
                    .elementFromPoint(event.clientX, event.clientY)
                    ?.closest<HTMLElement>(
                        '[data-invoice-cell][data-invoice-row]',
                    );

                if (
                    drag &&
                    target?.dataset.invoiceCell === drag.field &&
                    target.dataset.invoiceRow
                ) {
                    const rowId = Number(target.dataset.invoiceRow);
                    const value =
                        target.querySelector<HTMLInputElement>('input')
                            ?.value ??
                        target.textContent?.trim() ??
                        '';
                    extendSelection(rowId, drag.field, value);
                }

                return;
            }

            const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>('[data-invoice-cell][data-invoice-row]');

            if (
                target?.dataset.invoiceCell === fillDrag.current.field &&
                target.dataset.invoiceRow
            ) {
                fillDrag.current.targetId = Number(target.dataset.invoiceRow);
                setCellSelection({
                    rowId: fillDrag.current.targetId,
                    anchorId: fillDrag.current.rowId,
                    field: fillDrag.current.field,
                    value: fillDrag.current.value,
                });
            }
        };

        const handlePointerUp = () => {
            cellSelectDrag.current = null;
            const drag = fillDrag.current;
            fillDrag.current = null;

            if (!drag) {
                return;
            }

            const rowIds = getRowIds(localItems);
            const sourceIndex = rowIds.indexOf(drag.rowId);
            const targetIndex = rowIds.indexOf(drag.targetId);

            if (sourceIndex < 0 || targetIndex < 0) {
                return;
            }

            const direction = targetIndex >= sourceIndex ? 1 : -1;

            for (
                let index = sourceIndex + direction;
                direction > 0 ? index <= targetIndex : index >= targetIndex;
                index += direction
            ) {
                window.dispatchEvent(
                    new CustomEvent('invoice-cell-fill', {
                        detail: {
                            rowId: rowIds[index],
                            field: drag.field,
                            value: drag.value,
                        },
                    }),
                );
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [extendSelection, localItems, setCellSelection]);

    useEffect(() => {
        const extendSelectionWithShiftArrow = (event: KeyboardEvent) => {
            if (
                !event.shiftKey ||
                (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') ||
                !cellSelection
            ) {
                return;
            }

            const currentIndex = rowIds.indexOf(cellSelection.rowId);
            const targetIndex =
                currentIndex + (event.key === 'ArrowDown' ? 1 : -1);
            const targetRowId = rowIds[targetIndex];

            if (targetRowId === undefined) {
                return;
            }

            const targetCell = document.querySelector<HTMLElement>(
                `[data-invoice-row="${targetRowId}"][data-invoice-cell="${cellSelection.field}"]`,
            );
            const value =
                targetCell?.querySelector<HTMLInputElement>('input')?.value ??
                targetCell?.textContent?.trim() ??
                '';

            event.preventDefault();
            event.stopPropagation();
            extendSelection(targetRowId, cellSelection.field, value);
            window.dispatchEvent(new Event('invoice-close-unit-select'));
        };

        window.addEventListener('keydown', extendSelectionWithShiftArrow, true);

        return () => {
            window.removeEventListener(
                'keydown',
                extendSelectionWithShiftArrow,
                true,
            );
        };
    }, [cellSelection, extendSelection, rowIds]);

    useEffect(() => {
        const rowIds = getRowIds(localItems);

        const fillDown = (event: KeyboardEvent) => {
            const cell = (event.target as HTMLElement).closest<HTMLElement>(
                '[data-invoice-cell][data-invoice-row]',
            );

            if (
                cell &&
                ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
                    event.key,
                )
            ) {
                const fields = [
                    'boat_id',
                    'category_id',
                    'unit_count',
                    'unit_price',
                    'unit',
                    'weight',
                    'box',
                    'amount',
                    'difference',
                ];
                const rowIndex = rowIds.indexOf(
                    Number(cell.dataset.invoiceRow),
                );
                const columnIndex = fields.indexOf(
                    cell.dataset.invoiceCell ?? '',
                );
                let nextRow = rowIndex;
                let nextColumn = columnIndex;

                if (event.key === 'ArrowUp') {
                    nextRow -= 1;
                } else if (event.key === 'ArrowDown') {
                    nextRow += 1;
                } else if (event.key === 'ArrowLeft') {
                    nextColumn -= 1;
                } else {
                    nextColumn += 1;
                }

                const targetRowId = rowIds[nextRow];
                const targetField = fields[nextColumn];

                if (targetRowId !== undefined && targetField) {
                    const targetCell = document.querySelector<HTMLElement>(
                        `[data-invoice-row="${targetRowId}"][data-invoice-cell="${targetField}"]`,
                    );
                    const targetRow = localItems.find(
                        (row) => row.id === targetRowId,
                    );
                    const value =
                        targetCell?.querySelector<HTMLInputElement>('input')
                            ?.value ??
                        targetCell?.textContent?.trim() ??
                        String(
                            targetRow?.[targetField as keyof InvoiceItem] ?? '',
                        );

                    if (event.shiftKey && event.key.startsWith('Arrow')) {
                        if (
                            event.key === 'ArrowUp' ||
                            event.key === 'ArrowDown'
                        ) {
                            event.preventDefault();
                            extendSelection(targetRowId, targetField, value);
                        }
                    } else {
                        setCellSelection({
                            rowId: targetRowId,
                            field: targetField,
                            value,
                            anchorId: targetRowId,
                        });
                    }
                }
            }

            if (
                !(event.ctrlKey || event.metaKey) ||
                event.key.toLowerCase() !== 'd' ||
                !cellSelection
            ) {
                return;
            }

            event.preventDefault();
            const anchorIndex = rowIds.indexOf(cellSelection.anchorId);
            const endIndex = rowIds.indexOf(cellSelection.rowId);

            if (anchorIndex < 0 || endIndex < 0) {
                return;
            }

            const first = Math.min(anchorIndex, endIndex);
            const last = Math.max(anchorIndex, endIndex);
            const sourceRowId = rowIds[first];
            const sourceCell = document.querySelector<HTMLElement>(
                `[data-invoice-row="${sourceRowId}"][data-invoice-cell="${cellSelection.field}"]`,
            );
            const sourceControl =
                sourceCell?.querySelector<HTMLInputElement>('input');
            const value = sourceControl?.value ?? cellSelection.value;

            rowIds.slice(first + 1, last + 1).forEach((rowId) => {
                window.dispatchEvent(
                    new CustomEvent('invoice-cell-fill', {
                        detail: { rowId, field: cellSelection.field, value },
                    }),
                );
            });
        };

        window.addEventListener('keydown', fillDown);

        return () => window.removeEventListener('keydown', fillDown);
    }, [cellSelection, extendSelection, localItems, rowIds, setCellSelection]);

    // الحسابات
    const stats = useInvoiceCalculations(invoice);

    // Sensors لعملية الـ Drag & Drop
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // --- Logic: Actions ---
    /**
     * Lines targeted by the current delete dialog, used to count the linked
     * differences and sales shown in the warning.
     */
    const deleteTargetItems = deleteTarget
        ? invoice.items.filter((item) => deleteTarget.ids.includes(item.id))
        : [];

    const relatedDifferenceCount = deleteTargetItems.reduce(
        (sum, item) => sum + (item.differences?.length ?? 0),
        0,
    );

    const linkedSaleCount = deleteTargetItems.reduce(
        (sum, item) => sum + (item.sale_items?.length ?? 0),
        0,
    );
    const deletedCategoryIds = new Set(
        deleteTargetItems.map((item) => item.category_id),
    );
    const relatedGlobalSaleCount = sales.reduce(
        (sum, currentSale) =>
            sum +
            (currentSale.items ?? []).filter(
                (saleItem) =>
                    !saleItem.deleted_at &&
                    !saleItem.invoice_item_id &&
                    deletedCategoryIds.has(saleItem.item?.category_id ?? -1),
            ).length,
        0,
    );
    const relatedSaleCount = linkedSaleCount + relatedGlobalSaleCount;

    const closeDeleteDialog = () => {
        setDeleteTarget(null);
    };

    const confirmDelete = () => {
        if (!deleteTarget || deleteTarget.ids.length === 0) {
            return;
        }

        const { ids, single } = deleteTarget;

        const onSuccess = () => {
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
            closeDeleteDialog();
        };

        if (single) {
            router.delete(destroy([invoice.id, ids[0]]), {
                onSuccess,
                preserveScroll: true,
            });

            return;
        }

        router.post(
            destroyMany(invoice.id),
            {
                _method: 'DELETE',
                ids,
            },
            {
                onSuccess,
                preserveScroll: true,
            },
        );
    };

    const handleBulkDuplicate = () => {
        if (selectedIds.length === 0) {
            return;
        }

        router.post(
            duplicateMany(invoice.id),
            { ids: selectedIds },
            {
                onSuccess: () => setSelectedIds([]),
                preserveScroll: true,
            },
        );
    };

    // --- Drag & Drop Logic ---
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const isMovingBatch = selectedIds.includes(active.id as number);
            let newOrder: InvoiceItem[];

            if (isMovingBatch) {
                const movingItems = localItems.filter((item) =>
                    selectedIds.includes(item.id),
                );
                const remainingItems = localItems.filter(
                    (item) => !selectedIds.includes(item.id),
                );
                const overIndexInRemaining = remainingItems.findIndex(
                    (item) => item.id === over.id,
                );
                newOrder = [...remainingItems];
                newOrder.splice(overIndexInRemaining, 0, ...movingItems);
            } else {
                const oldIndex = localItems.findIndex(
                    (i) => i.id === active.id,
                );
                const newIndex = localItems.findIndex((i) => i.id === over.id);
                newOrder = arrayMove(localItems, oldIndex, newIndex);
            }

            setLocalItems(newOrder);
            router.post(
                reorder(invoice.id),
                { items: newOrder.map((i) => i.id) },
                {
                    preserveScroll: true,
                    preserveState: true,
                },
            );
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
        if (type === 'excel') {
            exportToExcel(invoice, localItems);
        }

        if (type === 'pdf') {
            exportToPDF(invoice, localItems, stats);
        }

        if (type === 'csv') {
            exportToCSV(invoice, localItems);
        }
    };

    const handleScreenshot = () => {
        copyToClipboard('invoice-content');
    };

    const { parsePasteData } = useInvoiceImport(boats, items);

    const handleImport = (text: string) => {
        const rawData = parsePasteData(text);

        if (rawData.length === 0) {
            toast.error('Aucune donnée valide trouvée.');

            return;
        }

        const cleanData = rawData.map((row) => ({
            boat_id: row.boat_id,
            category_id: row.category_id,
            unit_count: row.unit_count,
            unit_price: row.unit_price,
            unit: row.unit,
            weight: row.weight,
        }));

        router.post(
            bulkStore(invoice.id),
            {
                items: cleanData,
            },
            {
                onSuccess: () => {
                    toast.success('Importation réussie !');
                    setSelectedIds([]);
                },
                onError: (errors) => {
                    console.log(errors);
                    toast.error("Erreur lors de l'importation.");
                },
                preserveScroll: true,
            },
        );
    };

    const handleOpenDifference = (item: InvoiceItem) => {
        setDiffItem(item);
        setIsDiffOpen(true);
    };

    /** Vente d'une seule ligne de facture (action du menu de ligne). */
    const handleOpenSale = (item: InvoiceItem) => {
        setSaleItemIds([item.id]);
        setIsSaleOpen(true);
    };

    /** Vente de toutes les lignes cochées (vendre une sélection d'un coup). */
    const handleOpenSaleSelection = () => {
        if (selectedIds.length === 0) {
            {
                return;
            }
        }

        setSaleItemIds(selectedIds);
        setIsSaleOpen(true);
    };

    /** Suppression d'une seule ligne (menu de ligne) via le dialogue. */
    const handleOpenDelete = (item: InvoiceItem) => {
        setDeleteTarget({ ids: [item.id], single: true });
    };

    /** Suppression de toutes les lignes cochées via le dialogue. */
    const handleOpenBulkDelete = () => {
        if (selectedIds.length === 0) {
            return;
        }

        setDeleteTarget({ ids: selectedIds, single: false });
    };

    return (
        <div className="mx-auto min-h-screen max-w-7xl space-y-5 bg-white p-6 font-sans text-slate-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Head title={`Facture ${invoice.invoice_number}`} />

            <button
                type="button"
                onClick={() => router.visit(backUrl, { fresh: true })}
                className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            {/* Header & Stats */}
            <InvoiceHeader invoice={invoice} />

            <InvoiceStatsGrid
                stats={stats}
                availableStockByCategory={availableStockByCategory}
            />

            <div className="flex justify-end gap-4 print:hidden">
                <Button
                    onClick={handleScreenshot}
                    variant="outline"
                    size="sm"
                    title="Copy for WhatsApp"
                    className="h-9 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                    <Camera className="h-4 w-4" />
                </Button>

                <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                    <Printer className="h-3 w-3" />
                </Button>

                <Button
                    onClick={() => setIsGlobalSaleOpen(true)}
                    variant="outline"
                    size="sm"
                    title="Ajouter un article à une vente"
                    aria-label="Ajouter un article à une vente"
                    className="h-9 border-amber-200 text-amber-700 shadow-sm hover:bg-amber-50 dark:border-amber-900 dark:bg-neutral-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
                >
                    <ShoppingCart className="h-4 w-4" />
                </Button>

                <ImportItemsDialog onImport={handleImport} />

                <ExportDropdown onExport={handleExport} />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                {selectedIds.length > 0 ? (
                    <div className="flex animate-in items-center gap-3 duration-200 fade-in slide-in-from-left-2">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                {selectedIds.length} sélectionnés
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 px-2 text-[10px] font-black tracking-tighter text-slate-500 uppercase transition-colors hover:bg-red-50 hover:text-red-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="h-3.5 w-3.5" /> Annuler
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 text-xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                onClick={handleBulkDuplicate}
                            >
                                <Copy className="h-3.5 w-3.5" /> Dupliquer
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8 gap-2 bg-emerald-600 text-xs text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                onClick={handleOpenSaleSelection}
                            >
                                <ShoppingCart className="h-3.5 w-3.5" /> Vente
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 gap-2 text-xs"
                                onClick={handleOpenBulkDelete}
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div />
                )}
            </div>

            {/* Table Area */}
            <div
                id="invoice-content"
                className="relative flex max-h-[calc(100vh-3.5rem)] flex-col overflow-hidden rounded-lg border border-slate-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-2 print:hidden">
                    <InvoiceGlobalSearch
                        value={filters.search}
                        onChange={(search) =>
                            setFilters((current) => ({ ...current, search }))
                        }
                        showColumnFilters={showColumnFilters}
                        activeFilterCount={activeFilterCount}
                        onToggleColumnFilters={toggleColumnFilters}
                    />
                    <div className="flex items-center gap-2">
                        <InvoiceSelectionStatistics
                            statistics={selectionStatistics}
                        />
                        <span className="text-xs text-muted-foreground">
                            {filteredItems.length} / {localItems.length} lignes
                        </span>
                    </div>
                </div>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <div className="shrink-0">
                        <Table>
                            <colgroup>
                                <col className="w-8" />
                                <col className="w-10" />
                                <col className="w-55" />
                                <col className="w-50" />
                                <col className="w-20" />
                                <col className="w-28" />
                                <col className="w-28" />
                                <col className="w-24" />
                                <col className="w-20" />
                                <col className="w-25" />
                                <col className="w-20" />
                                <col className="w-10" />
                                <col className="w-10" />
                            </colgroup>
                            <TableHeader
                                className={`border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                            >
                                <InvoiceColumnTotals
                                    items={filteredItems}
                                    visible={showColumnFilters}
                                />
                                <TableRow className="h-11 hover:bg-transparent">
                                    <TableHead className="w-8 print:hidden"></TableHead>
                                    <TableHead className="w-10 print:hidden">
                                        <Checkbox
                                            className="mt-1 mr-2"
                                            checked={
                                                selectedIds.length ===
                                                    filteredItems.length &&
                                                filteredItems.length > 0
                                            }
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedIds(
                                                        (current) => [
                                                            ...new Set([
                                                                ...current,
                                                                ...filteredItems.map(
                                                                    (item) =>
                                                                        item.id,
                                                                ),
                                                            ]),
                                                        ],
                                                    );
                                                } else {
                                                    const visibleIds = new Set(
                                                        filteredItems.map(
                                                            (item) => item.id,
                                                        ),
                                                    );
                                                    setSelectedIds((current) =>
                                                        current.filter(
                                                            (id) =>
                                                                !visibleIds.has(
                                                                    id,
                                                                ),
                                                        ),
                                                    );
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Bateau
                                            <InvoiceColumnFilter
                                                column="boat"
                                                title="Bateau"
                                                options={[
                                                    ...new Set(
                                                        localItems
                                                            .map(
                                                                (row) =>
                                                                    row.boat
                                                                        ?.name,
                                                            )
                                                            .filter(
                                                                (
                                                                    name,
                                                                ): name is string =>
                                                                    Boolean(
                                                                        name,
                                                                    ),
                                                            ),
                                                    ),
                                                ].sort()}
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Catégorie
                                            <InvoiceColumnFilter
                                                column="category"
                                                title="Catégorie"
                                                options={[
                                                    ...new Set(
                                                        localItems
                                                            .map(
                                                                (row) =>
                                                                    row.category
                                                                        ?.name,
                                                            )
                                                            .filter(
                                                                (
                                                                    name,
                                                                ): name is string =>
                                                                    Boolean(
                                                                        name,
                                                                    ),
                                                            ),
                                                    ),
                                                ].sort()}
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Qte / NC
                                            <InvoiceColumnFilter
                                                column="quantity"
                                                title="Quantité"
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="pr-6 text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Prix Unitaire
                                            <InvoiceColumnFilter
                                                column="price"
                                                title="Prix unitaire"
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Unité
                                            <InvoiceColumnFilter
                                                column="unit"
                                                title="Unité"
                                                options={[
                                                    ...new Set(
                                                        localItems.map(
                                                            (row) => row.unit,
                                                        ),
                                                    ),
                                                ].sort()}
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="pr-6 text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Poids
                                            <InvoiceColumnFilter
                                                column="weight"
                                                title="Poids"
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="pr-8 text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Caisses
                                            <InvoiceColumnFilter
                                                column="boxes"
                                                title="Caisses"
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="px-6 text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Valeur DH
                                            <InvoiceColumnFilter
                                                column="amount"
                                                title="Valeur DH"
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="w-28 pr-6 text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                        <span className="inline-flex items-center">
                                            Différence
                                            <InvoiceColumnFilter
                                                column="difference"
                                                title="Différence"
                                                options={[
                                                    'Avec différence',
                                                    'Sans différence',
                                                ]}
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="w-12 pr-4 text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400 print:hidden">
                                        <span className="inline-flex items-center">
                                            Vente
                                            <InvoiceColumnFilter
                                                column="sale"
                                                title="Vente"
                                                options={[
                                                    'Avec vente',
                                                    'Sans vente',
                                                ]}
                                                filters={filters}
                                                setFilters={setFilters}
                                            />
                                        </span>
                                    </TableHead>
                                    <TableHead className="w-12 print:hidden"></TableHead>
                                </TableRow>
                            </TableHeader>
                        </Table>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <Table>
                            <colgroup>
                                <col className="w-8" />
                                <col className="w-10" />
                                <col className="w-45" />
                                <col className="w-45" />
                                <col className="w-24" />
                                <col className="w-28" />
                                <col className="w-28" />
                                <col className="w-24" />
                                <col className="w-20" />
                                <col className="w-32" />
                                <col className="w-28" />
                                <col className="w-12" />
                                <col className="w-12" />
                            </colgroup>
                            <TableBody>
                                <InvoiceItemRow
                                    invoiceId={invoice.id}
                                    boats={boats}
                                    items={items}
                                    owners={owners}
                                    categories={categories}
                                    isNew={true}
                                    onCellSelect={handleCellSelect}
                                    onFillStart={handleFillStart}
                                    selectedCell={getSelectedCellRange(
                                        NEW_INVOICE_ITEM_ROW_ID,
                                    )}
                                    onOpenDifference={() => {}} // New row doesn't need this
                                    onOpenSale={() => {}} // New row doesn't need this
                                />

                                <SortableContext
                                    items={filteredItems.map((i) => i.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {filteredItems.map((row) => (
                                        <InvoiceItemRow
                                            key={row.id}
                                            invoiceId={invoice.id}
                                            item={row}
                                            boats={boats}
                                            items={items}
                                            owners={owners}
                                            categories={categories}
                                            globalSoldCount={
                                                globalSoldCountByInvoiceItem[
                                                    row.id
                                                ] ?? 0
                                            }
                                            onCellSelect={handleCellSelect}
                                            onFillStart={handleFillStart}
                                            selectedCell={getSelectedCellRange(
                                                row.id,
                                            )}
                                            selected={selectedIds.includes(
                                                row.id,
                                            )}
                                            onSelectChange={(checked) => {
                                                setSelectedIds((prev) =>
                                                    checked
                                                        ? [...prev, row.id]
                                                        : prev.filter(
                                                              (id) =>
                                                                  id !== row.id,
                                                          ),
                                                );
                                            }}
                                            onOpenDifference={
                                                handleOpenDifference
                                            }
                                            onOpenSale={handleOpenSale}
                                            onDelete={handleOpenDelete}
                                        />
                                    ))}
                                </SortableContext>
                            </TableBody>
                        </Table>
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {activeId
                            ? (() => {
                                  const isSelected = selectedIds.includes(
                                      activeId as number,
                                  );
                                  const itemsToDisplay = isSelected
                                      ? localItems.filter((item) =>
                                            selectedIds.includes(item.id),
                                        )
                                      : localItems.filter(
                                            (item) => item.id === activeId,
                                        );

                                  return (
                                      <InvoiceItemDragOverlay
                                          items={itemsToDisplay}
                                      />
                                  );
                              })()
                            : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <InvoicePrintFooter stats={stats} />

            <DeleteInvoiceItemsDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDeleteDialog();
                    }
                }}
                onConfirm={confirmDelete}
                count={deleteTarget?.ids.length ?? 0}
                requireConfirmation={
                    deleteTarget !== null && !deleteTarget.single
                }
                differenceCount={relatedDifferenceCount}
                saleCount={relatedSaleCount}
            />

            {/* Difference Dialog Component */}
            {diffItem && (
                <DifferenceDialog
                    key={diffItem.id}
                    open={isDiffOpen}
                    onOpenChange={setIsDiffOpen}
                    item={diffItem}
                    customers={customers}
                    items={items}
                    categories={categories}
                />
            )}

            {/* Sale Dialog Component (Vente) */}
            {isSaleOpen && saleItems.length > 0 && (
                <SaleDialog
                    key={saleItems.map((item) => item.id).join('-')}
                    open={isSaleOpen}
                    onOpenChange={setIsSaleOpen}
                    items={saleItems}
                    sales={sales}
                    catalogItems={items}
                    availableStockByCategory={availableStockByCategory}
                    customers={customers}
                    session={session}
                />
            )}

            <GlobalSaleDialog
                open={isGlobalSaleOpen}
                onOpenChange={setIsGlobalSaleOpen}
                sales={sales}
                items={items}
                invoiceCatalogItems={invoiceCatalogItems}
                categories={categories}
                invoiceCategoryIds={[...invoiceCategoryIds]}
                categoryUnitById={categoryUnitById}
                availableStockByCategory={availableStockByCategory}
                customers={customers}
                session={session}
            />
        </div>
    );
}

InvoiceShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Factures', href: invoices() },
            { title: 'Détails de la Facture', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
