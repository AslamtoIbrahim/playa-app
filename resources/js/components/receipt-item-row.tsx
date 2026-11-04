import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Check, GripVertical, Loader2 } from 'lucide-react';

// Drag & Drop
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types & Logic
import { Checkbox } from '@/components/ui/checkbox';
import { useReceiptItem } from '@/hooks/use-receipt-item'; // غادي نكرييو هاد الهوك
import { Item } from '@/types/item';
import { ReceiptItem } from '@/types/receipt-item';
import { SearchSelect } from './search-select';
import { ReceiptRowActions } from './receipt-row-actions';
import { useEffect } from 'react';

export const NEW_RECEIPT_ITEM_ROW_ID = -1;

interface Props {
    receiptId: number;
    item?: ReceiptItem;
    items: Item[]; // قائمة الأسماك (Species)
    isNew?: boolean;
    selected?: boolean;
    onSelectChange?: (checked: boolean) => void;
    onCellSelect?: (rowId: number, field: string, value: string, shift: boolean) => void;
    selectedCell?: string | null;
}

export default function ReceiptItemRow({
    receiptId,
    item,
    items,
    isNew,
    selected,
    onSelectChange,
    onCellSelect,
    selectedCell,
}: Props) {
    // استعمال هوك مخصص للـ ReceiptItem
    const {
        data,
        handleDataChange,
        loading,
        openItem,
        rowTotal,
        setOpenItem,
        isReadyToSave,
        submitSave,
        handleKeyDown,
        handleBlur,
    } = useReceiptItem({ receiptId, item, isNew });

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
    const rowId = item?.id ?? (isNew ? NEW_RECEIPT_ITEM_ROW_ID : undefined);

    useEffect(() => {
        if (rowId === undefined) {
            return;
        }

        const applyFill = (event: Event) => {
            const detail = (event as CustomEvent<{ rowId: number; field: string; value: string }>).detail;

            if (detail.rowId === rowId && ['box', 'unit_count', 'real_price', 'item_id'].includes(detail.field)) {
                handleDataChange({ [detail.field]: detail.value });
            }
        };

        window.addEventListener('receipt-cell-fill', applyFill);

        return () => window.removeEventListener('receipt-cell-fill', applyFill);
    }, [handleDataChange, rowId]);

    const cellProps = (field: string, value: string | number) => {
        const selectionKey = `|${rowId}:${field}|`;
        const isSelected = selectedCell?.includes(selectionKey) ?? false;

        return {
        'data-receipt-cell': field,
        'data-receipt-row': rowId,
        tabIndex: -1,
        onMouseDownCapture: (event: React.MouseEvent) => {
            if (rowId !== undefined) {
                onCellSelect?.(rowId, field, String(value), event.shiftKey);
            }

            if (event.shiftKey) {
                event.preventDefault();
                (document.activeElement as HTMLElement | null)?.blur();
            }
        },
        style: isSelected
            ? {
                  position: 'relative' as const,
                  backgroundColor: 'rgb(59 130 246 / 12%)',
                  boxShadow: [
                      'inset 1px 0 rgb(59 130 246)',
                      'inset -1px 0 rgb(59 130 246)',
                      selectedCell?.startsWith(selectionKey)
                          ? 'inset 0 1px rgb(59 130 246)'
                          : '',
                      selectedCell?.endsWith(selectionKey)
                          ? 'inset 0 -1px rgb(59 130 246)'
                          : '',
                  ].filter(Boolean).join(', '),
              }
            : undefined,
        };
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: (isDragging ? 'relative' : 'static') as any,
    };

    const inputBaseClass = 'border-none rounded-none h-10 text-xs shadow-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-0 w-full font-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';



    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn(
                'group border-b border-slate-200 dark:border-slate-800',
                isNew ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50',
                isDragging && 'bg-blue-50/80 dark:bg-blue-950/80 shadow-2xl opacity-80',
                selected && 'bg-blue-50/50 dark:bg-blue-950/50',
                isNew && 'print:hidden',
            )}
        >
            {/* 1. Drag Handle */}
            <TableCell className="w-8 border-r border-slate-200 p-0 text-center print:hidden dark:border-slate-800">
                {!isNew && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="flex h-10 w-full cursor-grab items-center justify-center text-slate-300 transition-colors hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
            </TableCell>

            {/* 2. Checkbox */}
            <TableCell {...cellProps('selection', selected ? '1' : '0')} data-receipt-selection-control className="w-8 border-r border-slate-200 p-0 text-center print:hidden dark:border-slate-800">
                {!isNew && (
                    <div className="flex h-10 items-center justify-center">
                        <Checkbox
                            checked={selected || false}
                            onFocus={() => rowId !== undefined && onCellSelect?.(rowId, 'selection', selected ? '1' : '0', false)}
                            onKeyDown={handleKeyDown}
                            onKeyDownCapture={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onSelectChange?.(!selected);
                                }
                            }}
                            onCheckedChange={(checked: boolean) => onSelectChange?.(checked)}
                            className="h-4 w-4 border-slate-300 dark:border-slate-600"
                        />
                    </div>
                )}
            </TableCell>

            {/* 5. Caisses (box) */}
            <TableCell {...cellProps('box', data.box)} className="w-24 border-r border-slate-200 p-0 dark:border-slate-800">
                <Input
                    type="number"
                    value={data.box}
                    placeholder="0"
                    onChange={(e) => handleDataChange({ box: e.target.value })}
                    onKeyDown={handleKeyDown}
                    onFocus={() => rowId !== undefined && onCellSelect?.(rowId, 'box', String(data.box), false)}
                    onKeyDownCapture={(event) => {
                        if ((event.key === 'Delete' || event.key === 'Backspace') && event.currentTarget.value !== '') {
                            event.preventDefault();
                            handleDataChange({ box: '' });
                        }
                    }}
                    onBlur={handleBlur}
                    className={cn(inputBaseClass, 'text-center font-medium')}
                />
            </TableCell>

            {/* 3. Espèce (Item) */}
            <TableCell {...cellProps('item_id', data.item_id)} className="min-w-45 border-r border-slate-200 p-0 dark:border-slate-800">
                <SearchSelect
                    value={data.item_id}
                    options={items}
                    placeholder="Saisir espèce..."
                    className="h-10 w-full border-none bg-transparent px-3 text-left text-xs shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    open={openItem}
                    onOpenChange={setOpenItem}
                    onFocus={() => rowId !== undefined && onCellSelect?.(rowId, 'item_id', String(data.item_id), false)}
                    onKeyDown={(e) => handleKeyDown(e, 'item')}
                    onCellKeyDown={(event) => {
                        if (event.key === 'Delete' || event.key === 'Backspace') {
                            event.preventDefault();
                            handleDataChange({ item_id: '' });
                        }
                    }}
                    onSelect={(id) => {
                        handleDataChange({ item_id: id });
                        setOpenItem(false);
                    }}
                />
            </TableCell>

            {/* 4. Quantité (unit_count) */}
            <TableCell {...cellProps('unit_count', data.unit_count)} className="w-28 border-r border-slate-200 p-0 dark:border-slate-800">
                <Input
                    type="number"
                    value={data.unit_count}
                    placeholder="0.00"
                    onChange={(e) => handleDataChange({ unit_count: e.target.value })}
                    onFocus={() => rowId !== undefined && onCellSelect?.(rowId, 'unit_count', String(data.unit_count), false)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => rowId !== undefined && onCellSelect?.(rowId, 'unit_count', String(data.unit_count), false)}
                    onKeyDownCapture={(event) => {
                        if ((event.key === 'Delete' || event.key === 'Backspace') && event.currentTarget.value !== '') {
                            event.preventDefault();
                            handleDataChange({ unit_count: '' });
                        }
                    }}
                    onBlur={handleBlur}
                    className={cn(inputBaseClass, 'text-center font-medium')}
                />
            </TableCell>


            {/* 6. Prix Unitaire (real_price) */}
            <TableCell {...cellProps('real_price', data.real_price)} className="w-32 border-r border-slate-200 p-0 dark:border-slate-800">
                <Input
                    type="number"
                    value={data.real_price}
                    placeholder="0.00"
                    onChange={(e) => handleDataChange({ real_price: e.target.value })}
                    onFocus={() => rowId !== undefined && onCellSelect?.(rowId, 'real_price', String(data.real_price), false)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => rowId !== undefined && onCellSelect?.(rowId, 'real_price', String(data.real_price), false)}
                    onKeyDownCapture={(event) => {
                        if ((event.key === 'Delete' || event.key === 'Backspace') && event.currentTarget.value !== '') {
                            event.preventDefault();
                            handleDataChange({ real_price: '' });
                        }
                    }}
                    onBlur={handleBlur}
                    className={cn(inputBaseClass, 'pr-4 text-right')}
                />
            </TableCell>

            {/* 7. Total (total_diff) */}
            <TableCell className="w-36 bg-slate-50/30 px-6 text-right text-xs font-bold text-slate-900 dark:bg-slate-800/30 dark:text-slate-100">
                {
                    rowTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                }
            </TableCell>

            {/* 8. Actions */}
            <TableCell className="relative w-12 border-l border-slate-200 p-0 text-center print:hidden dark:border-slate-800">
                {loading ? (
                    <div className="flex h-10 w-full items-center justify-center">
                        <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
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
                                        ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                                        : 'cursor-not-allowed text-slate-300 dark:text-slate-600',
                                )}
                                onClick={() => isReadyToSave() && submitSave(data)}
                            >
                                <Check className="h-5 w-5" />
                            </Button>
                        ) : (
                            <div className="w-full opacity-0 transition-opacity group-hover:opacity-100">
                                <ReceiptRowActions
                                    receiptId={receiptId}
                                    item={item!}
                                    data={data}
                                />
                            </div>
                        )}
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}
