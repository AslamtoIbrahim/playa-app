import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    computeInvoiceItemDifferenceTotal,
    formatDifferenceAmount,
} from '@/lib/differences';
import { Check, Loader2, GripVertical } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';

// Drag & Drop
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types & Logic
import { Boat, Owner } from '@/types/boat';
import { Category } from '@/types/category';
import { Item } from '@/types/item';
import { InvoiceItem } from '@/types/invoice-item';
import { Checkbox } from './ui/checkbox';
import { InvoiceRowActions } from './invoice-row-actions';
import { InvoiceItemSaleButton } from './invoice-sale-button';
import { useInvoiceItem } from '@/hooks/use-invoice-item';
import { SearchSelect } from './search-select';
import MissingBoatPopup from './missing-boat-popup';
import MissingCategoryPopup from './missing-category-popup';

/**
 * Synthetic id for the unsaved row displayed at the top of the table. It lets
 * the cell selection (blue range + fill handle) work before the row is saved.
 */
export const NEW_INVOICE_ITEM_ROW_ID = -1;

interface Props {
    invoiceId: number;
    item?: InvoiceItem;
    boats: Boat[];
    items: Item[];
    isNew?: boolean;
    selected?: boolean;
    onSelectChange?: (checked: boolean) => void;
    onOpenDifference: (item: InvoiceItem) => void;
    onOpenSale: (item: InvoiceItem) => void;
    /** Ouvre le dialogue de suppression (différences / ventes liées). */
    onDelete?: (item: InvoiceItem) => void;
    owners: Owner[];
    categories: Category[];
    globalSoldCount?: number;
    onCellSelect?: (rowId: number, field: string, value: string, shift: boolean) => void;
    selectedCell?: string | null;
    onFillStart?: (rowId: number, field: string, value: string) => void;
}

export default function InvoiceItemRow({
    invoiceId,
    item,
    boats,
    isNew,
    selected,
    onSelectChange,
    onOpenDifference,
    onOpenSale,
    onDelete,
    owners,
    categories,
    globalSoldCount = 0,
    onCellSelect,
    selectedCell,
    onFillStart,
}: Props) {
    const {
        data,
        handleDataChange, // استعملنا هادي عوض setData
        loading,
        openBoat,
        setOpenBoat,
        openItem,
        setOpenItem,
        weight,
        amount,
        displayBox, // هادي هي القيمة اللي غتبان في الـ Input ديال الـ Box
        isReadyToSave,
        submitSave,
        handleKeyDown,
        handleBlur,
        handleRowBlur,
    } = useInvoiceItem({ invoiceId, item, isNew });

    /**
     * Row id used by the cell selection: the saved row id, or the synthetic
     * id for the unsaved row so it behaves like the saved rows.
     */
    const rowId = item?.id ?? (isNew ? NEW_INVOICE_ITEM_ROW_ID : undefined);
    const [isUnitSelectOpen, setIsUnitSelectOpen] = useState(false);
    const previousLoadingRef = useRef(loading);
    const restoreFocusFieldRef = useRef<string | null>(null);

    useEffect(() => {
        if (previousLoadingRef.current && !loading && isNew) {
            const field = restoreFocusFieldRef.current;
            restoreFocusFieldRef.current = null;

            if (field && rowId !== undefined) {
                requestAnimationFrame(() => {
                    const cell = document.querySelector<HTMLElement>(
                        `[data-invoice-row="${rowId}"][data-invoice-cell="${field}"]`,
                    );
                    const control = cell?.querySelector<HTMLElement>(
                        'input:not(:disabled), button:not(:disabled)',
                    );

                    (control ?? cell)?.focus();
                });
            }
        }

        previousLoadingRef.current = loading;
    }, [isNew, loading, rowId]);

    useEffect(() => {
        const closeUnitSelect = () => setIsUnitSelectOpen(false);
        window.addEventListener('invoice-close-unit-select', closeUnitSelect);

        return () => {
            window.removeEventListener(
                'invoice-close-unit-select',
                closeUnitSelect,
            );
        };
    }, []);

    useEffect(() => {
        if (rowId === undefined) {
            return;
        }

        const applyFill = (event: Event) => {
            const detail = (event as CustomEvent<{ rowId: number; field: string; value: string }>).detail;

            if (detail.rowId !== rowId) {
                return;
            }

            if (detail.field === 'boat_id') {
                handleDataChange({ boat_id: detail.value });
            } else if (detail.field === 'category_id') {
                const category = categories.find((entry) => String(entry.id) === detail.value);
                handleDataChange({ category_id: detail.value, unit: category?.name.trim().toLowerCase() === 'poulpe' ? 'kg' : 'caisse' });
            } else if (['unit_count', 'unit_price', 'unit', 'weight', 'box'].includes(detail.field)) {
                handleDataChange({ [detail.field]: detail.value });
            }
        };

        window.addEventListener('invoice-cell-fill', applyFill);

        return () => window.removeEventListener('invoice-cell-fill', applyFill);
    }, [rowId, categories, handleDataChange]);

    const cellProps = (field: string, value: string | number) => ({
        'data-invoice-cell': field,
        'data-invoice-row': rowId,
        tabIndex: -1,
        onMouseDownCapture: (event: React.MouseEvent) => {
            if (rowId !== undefined) {
                onCellSelect?.(rowId, field, String(value), event.shiftKey);
            }

            if (event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        onClickCapture: (event: React.MouseEvent) => {
            if (event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        onClick: (event: React.MouseEvent) => {
            if (event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        style: {
            cursor: field === 'amount' ? 'pointer' : 'cell',
            userSelect: 'none' as const,
            ...(rowId !== undefined &&
            selectedCell?.includes(`|${rowId}:${field}|`)
                ? {
                      position: 'relative' as const,
                      backgroundColor: 'rgb(59 130 246 / 12%)',
                      boxShadow: [
                          'inset 1px 0 rgb(59 130 246)',
                          'inset -1px 0 rgb(59 130 246)',
                          selectedCell.startsWith(`|${rowId}:${field}|`)
                              ? 'inset 0 1px rgb(59 130 246)'
                              : '',
                          selectedCell.endsWith(`|${rowId}:${field}|`)
                              ? 'inset 0 -1px rgb(59 130 246)'
                              : '',
                      ]
                          .filter(Boolean)
                          .join(', '),
                  }
                : {}),
        },
    });

    const isFillHandle = (field: string) =>
        rowId !== undefined &&
        (selectedCell?.endsWith(`|${rowId}:${field}|`) ?? false);

    const fillHandle = (field: string, value: string | number) =>
        rowId !== undefined && isFillHandle(field) ? (
            <button
                type="button"
                aria-label="Recopier la valeur vers les lignes suivantes"
                className="absolute -right-1.25 -bottom-1.25 z-20 size-2.5 cursor-crosshair rounded-full border border-white bg-blue-500 p-0 hover:cursor-crosshair dark:border-neutral-900"
                onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onFillStart?.(rowId, field, String(value));
                }}
                onClick={(event) => event.stopPropagation()}
            />
        ) : null;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item?.id || 'new-row',
        disabled: isNew,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: (isDragging ? 'relative' : 'static') as any,
    };

    /*
     * Total de la répartition du svelte : c'est exactement le montant affiché
     * par le DifferenceDialog (somme des écarts moins les commissions). Il se
     * rafraîchit dès qu'une différence est enregistrée, puisque `item` est
     * resynchronisé avec les props Inertia.
     */
    const differenceTotal = useMemo(() => {
        return computeInvoiceItemDifferenceTotal(item);
    }, [item]);

    const hasDifferences = (item?.differences?.length ?? 0) > 0;

    const cellFocusClass = 'transition-colors';
    const searchSelectClass =
        'h-10 w-full border-none bg-transparent px-3 text-left text-xs shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none';

    const inputBaseClass =
        'border-none rounded-none h-10 text-xs shadow-none bg-transparent focus-visible:ring-0 w-full font-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-neutral-100';

    const isSavingNewItem = Boolean(isNew && loading);

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            onBlurCapture={handleRowBlur}
            onKeyDownCapture={(event) => {
                if (
                    isNew &&
                    event.key === 'Enter' &&
                    !openBoat &&
                    !openItem &&
                    !isUnitSelectOpen
                ) {
                    restoreFocusFieldRef.current =
                        (event.target as HTMLElement)
                            .closest<HTMLElement>(
                                '[data-invoice-cell][data-invoice-row]',
                            )
                            ?.dataset.invoiceCell ?? null;
                }
            }}
            className={cn(
                'group border-b border-slate-100 dark:border-neutral-800',
                isNew
                    ? 'bg-slate-50/50 dark:bg-neutral-900/60'
                    : 'hover:bg-transparent',
                isNew &&
                    'hover:bg-slate-50/50 dark:hover:bg-neutral-900/60',
                isDragging && 'bg-blue-50/80 shadow-2xl dark:bg-blue-950/60',
                selected && 'bg-blue-50/50 dark:bg-blue-950/40',
                selected &&
                    'hover:bg-blue-50/50 dark:hover:bg-blue-950/40',
                isNew && 'print:hidden',
            )}
        >
            <TableCell className="w-8 border-r border-slate-100 p-0 text-center dark:border-neutral-800 print:hidden">
                {!isNew && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="flex h-10 w-full cursor-grab items-center justify-center text-slate-300 transition-colors hover:text-slate-600 dark:text-neutral-600 dark:hover:text-neutral-300"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
            </TableCell>

            <TableCell className="w-8 border-r border-slate-100 p-0 text-center dark:border-neutral-800 print:hidden">
                {!isNew && (
                    <div className="flex h-10 items-center justify-center">
                        <Checkbox
                            checked={selected || false}
                            onCheckedChange={(checked: boolean) => {
                                {
                                    onSelectChange?.(checked);
                                }
                            }}
                            className="h-4 w-4 border-slate-300 dark:border-neutral-700 dark:data-[state=checked]:bg-blue-600 dark:data-[state=checked]:text-white"
                        />
                    </div>
                )}
            </TableCell>

            <TableCell
                {...cellProps('boat_id', data.boat_id)}
                className={cn(
                    'w-45 border-r border-slate-100 p-0 dark:border-neutral-800',
                    cellFocusClass,
                )}
            >
                <SearchSelect
                    value={data.boat_id}
                    options={boats}
                    placeholder="Choisir bateau..."
                    renderNoMatchAction={(search) => (
                        <MissingBoatPopup
                            initialName={search}
                            owners={owners}
                        />
                    )}
                    open={openBoat}
                    onOpenChange={setOpenBoat}
                    disabled={isSavingNewItem}
                    className={searchSelectClass}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e, 'boat');
                        }
                    }}
                    onSelect={(id) => {
                        {
                            handleDataChange({ boat_id: id });
                            setOpenBoat(false);
                        }
                    }}
                />
                {fillHandle('boat_id', data.boat_id)}
            </TableCell>

            <TableCell
                {...cellProps('category_id', data.category_id)}
                className={cn(
                    'w-45 border-r border-slate-100 p-0 dark:border-neutral-800',
                    cellFocusClass,
                )}
            >
                <SearchSelect
                    value={data.category_id}
                    options={categories}
                    placeholder="Choisir catégorie..."
                    renderNoMatchAction={(search) => (
                        <MissingCategoryPopup initialName={search} />
                    )}
                    open={openItem}
                    onOpenChange={setOpenItem}
                    disabled={isSavingNewItem}
                    className={searchSelectClass}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e, 'item');
                        }
                    }}
                    onSelect={(id) => {
                        {
                            const selectedCategory = categories.find(
                                (category) => String(category.id) === String(id),
                            );
                            const isPoulpeCategory =
                                selectedCategory?.name.trim().toLowerCase() ===
                                'poulpe';

                            handleDataChange({
                                category_id: id,
                                unit: isPoulpeCategory ? 'kg' : 'caisse',
                            });

                            setOpenItem(false);
                        }
                    }}
                />
                {fillHandle('category_id', data.category_id)}
            </TableCell>

            <TableCell
                {...cellProps('unit_count', data.unit_count)}
                className={cn(
                    'w-24 border-r border-slate-100 p-0 dark:border-neutral-800',
                    cellFocusClass,
                )}
            >
                <Input
                    type="number"
                    disabled={isSavingNewItem}
                    value={data.unit_count}
                    onChange={(e) => {
                        {
                            handleDataChange({ unit_count: e.target.value });
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className={cn(inputBaseClass, 'text-center')}
                />
                {fillHandle('unit_count', data.unit_count)}
            </TableCell>

            <TableCell
                {...cellProps('unit_price', data.unit_price)}
                className={cn(
                    'w-28 border-r border-slate-100 p-0 dark:border-neutral-800',
                    cellFocusClass,
                )}
            >
                <Input
                    type="number"
                    disabled={isSavingNewItem}
                    value={data.unit_price}
                    onChange={(e) => {
                        {
                            handleDataChange({ unit_price: e.target.value });
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className={cn(inputBaseClass, 'pr-4 text-right')}
                />
                {fillHandle('unit_price', data.unit_price)}
            </TableCell>

            <TableCell
                {...cellProps('unit', data.unit)}
                className={cn(
                    'w-28 border-r border-slate-100 p-0 dark:border-neutral-800',
                    cellFocusClass,
                )}
            >
                <Select
                    open={isUnitSelectOpen}
                    onOpenChange={setIsUnitSelectOpen}
                    value={data.unit}
                    onValueChange={(val) => {
                        {
                            handleDataChange({ unit: val });
                        }
                    }}
                >
                    <SelectTrigger
                        disabled={isSavingNewItem}
                        onKeyDown={handleKeyDown}
                        className="h-10 w-full rounded-none border-none bg-transparent px-3 text-[10px] text-slate-900 uppercase shadow-none focus:ring-0 dark:text-neutral-100"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                        position="item-aligned"
                        className="dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                        <SelectItem
                            value="caisse"
                            className="py-2 text-xs uppercase dark:focus:bg-neutral-800"
                        >
                            Caisse
                        </SelectItem>
                        <SelectItem
                            value="kg"
                            className="py-2 text-xs uppercase dark:focus:bg-neutral-800"
                        >
                            Kg
                        </SelectItem>
                    </SelectContent>
                </Select>
                {fillHandle('unit', data.unit)}
            </TableCell>

            <TableCell
                {...cellProps('weight', weight)}
                className={cn(
                    'w-24 border-r border-slate-100 p-0 dark:border-neutral-800',
                    cellFocusClass,
                )}
            >
                <Input
                    type="number"
                    disabled={isSavingNewItem}
                    value={weight}
                    onChange={(e) => {
                        {
                            handleDataChange({ weight: e.target.value });
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className={cn(
                        inputBaseClass,
                        'text-center font-medium',
                        data.unit === 'caisse' &&
                            Number(weight) !== Number(data.unit_count) * 21
                            ? 'font-bold text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 dark:text-neutral-400',
                    )}
                />
                {fillHandle('weight', weight)}
            </TableCell>

            {/* BOX - الحقل الجديد */}
            <TableCell
                {...cellProps('box', displayBox)}
                className={cn(
                    'w-20 border-r border-slate-100 p-0 dark:border-neutral-800',
                    cellFocusClass,
                )}
            >
                <Input
                    type="number"
                    disabled={isSavingNewItem}
                    value={displayBox}
                    readOnly={data.unit === 'caisse'}
                    onChange={(e) => {
                        {
                            handleDataChange({ box: e.target.value });
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className={cn(
                        inputBaseClass,
                        'text-center font-bold text-blue-900 dark:text-blue-300',
                        data.unit === 'caisse' &&
                            'font-normal text-slate-500 dark:text-neutral-400',
                    )}
                />
                {fillHandle('box', displayBox)}
            </TableCell>

            <TableCell
                {...cellProps('amount', amount)}
                className={cn(
                    'w-32 bg-slate-50/10 px-6 text-right text-xs font-normal text-slate-900 dark:bg-neutral-900/20 dark:text-neutral-100',
                    cellFocusClass,
                )}
            >
                {amount > 0
                    ? amount.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                      })
                    : '0.00'}
            </TableCell>

            {/* DIFFÉRENCE : clic = ouvrir le DifferenceDialog */}
            <TableCell
                {...cellProps('difference', differenceTotal)}
                className={cn(
                    'w-28 bg-slate-50/10 p-0 dark:bg-neutral-900/20',
                    cellFocusClass,
                )}
            >
                <button
                    type="button"
                    disabled={!item}
                    onClick={() => {
                        if (item) {
                            {
                                onOpenDifference(item);
                            }
                        }
                    }}
                    title={
                        item ? 'Voir la répartition des différences' : undefined
                    }
                    className={cn(
                        'flex h-10 w-full items-center justify-end px-4 text-right text-xs font-semibold transition-colors',
                        item &&
                            'cursor-pointer hover:bg-blue-50/60 focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-blue-950/40 dark:focus-visible:ring-neutral-700',
                        !item &&
                            'cursor-not-allowed text-slate-300 dark:text-neutral-700',
                        hasDifferences &&
                            differenceTotal > 0 &&
                            'text-green-600 dark:text-green-400',
                        hasDifferences &&
                            differenceTotal < 0 &&
                            'text-red-600 dark:text-red-400',
                        hasDifferences &&
                            differenceTotal === 0 &&
                            'text-slate-600 dark:text-neutral-300',
                        !hasDifferences &&
                            'text-slate-400 dark:text-neutral-500',
                    )}
                >
                    {hasDifferences
                        ? (differenceTotal > 0 ? '+' : '') +
                          formatDifferenceAmount(differenceTotal)
                        : '0.00'}
                </button>
            </TableCell>

            {/* VENTE : ouvre le dialogue de vente */}
            <TableCell className="w-12 p-0 text-center print:hidden">
                <div className="flex h-10 w-full items-center justify-center">
                    <InvoiceItemSaleButton
                        item={item}
                        globalSoldCount={globalSoldCount}
                        onOpenSale={onOpenSale}
                    />
                </div>
            </TableCell>

            <TableCell className="relative w-12 border-l border-slate-100 p-0 text-center dark:border-neutral-800 print:hidden">
                {loading ? (
                    <div className="flex h-10 w-full items-center justify-center">
                        <Loader2 className="h-3 w-3 animate-spin text-slate-400 dark:text-neutral-500" />
                    </div>
                ) : (
                    <div className="flex h-10 w-full items-center justify-center">
                        {isNew ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    'h-10 w-full rounded-none transition-colors',
                                    isReadyToSave()
                                        ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40'
                                        : 'cursor-not-allowed text-slate-300 dark:text-neutral-700',
                                )}
                                onClick={() => {
                                    if (isReadyToSave()) {
                                        {
                                            submitSave(data);
                                        }
                                    }
                                }}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="w-full opacity-0 transition-opacity group-hover:opacity-100">
                                <InvoiceRowActions
                                    invoiceId={invoiceId}
                                    item={item!}
                                    data={data}
                                    onOpenDifference={onOpenDifference}
                                    onOpenSale={onOpenSale}
                                    onDelete={(target) => {
                                        onDelete?.(target);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}
