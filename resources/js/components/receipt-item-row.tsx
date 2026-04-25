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

interface Props {
    receiptId: number;
    item?: ReceiptItem;
    items: Item[]; // قائمة الأسماك (Species)
    isNew?: boolean;
    selected?: boolean;
    onSelectChange?: (checked: boolean) => void;
}

export default function ReceiptItemRow({
    receiptId,
    item,
    items,
    isNew,
    selected,
    onSelectChange,
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: (isDragging ? 'relative' : 'static') as any,
    };

    const cellFocusClass = 'focus-within:ring-1 focus-within:ring-inset focus-within:ring-blue-300 focus-within:bg-blue-50/30 transition-all';
    const inputBaseClass = 'border-none rounded-none h-10 text-xs shadow-none bg-transparent focus-visible:ring-0 w-full font-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';



    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn(
                'group border-b',
                isNew ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50',
                isDragging && 'bg-blue-50/80 shadow-2xl opacity-80',
                selected && 'bg-blue-50/50',
                isNew && 'print:hidden',
            )}
        >
            {/* 1. Drag Handle */}
            <TableCell className="w-8 border-r p-0 text-center print:hidden">
                {!isNew && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="flex h-10 w-full cursor-grab items-center justify-center text-slate-300 transition-colors hover:text-slate-600"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
            </TableCell>

            {/* 2. Checkbox */}
            <TableCell className="w-8 border-r p-0 text-center print:hidden">
                {!isNew && (
                    <div className="flex h-10 items-center justify-center">
                        <Checkbox
                            checked={selected || false}
                            onCheckedChange={(checked: boolean) => onSelectChange?.(checked)}
                            className="h-4 w-4 border-slate-300"
                        />
                    </div>
                )}
            </TableCell>

            {/* 5. Caisses (box) */}
            <TableCell className={cn('w-24 border-r p-0', cellFocusClass)}>
                <Input
                    type="number"
                    value={data.box}
                    placeholder="0"
                    onChange={(e) => handleDataChange({ box: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, 'text-center font-medium')}
                />
            </TableCell>

            {/* 3. Espèce (Item) */}
            <TableCell className={cn('min-w-45 border-r p-0', cellFocusClass)}>
                <SearchSelect
                    value={data.item_id}
                    options={items}
                    placeholder="Saisir espèce..."
                    open={openItem}
                    onOpenChange={setOpenItem}
                    onKeyDown={(e) => handleKeyDown(e, 'item')}
                    onSelect={(id) => {
                        handleDataChange({ item_id: id });
                        setOpenItem(false);
                    }}
                />
            </TableCell>

            {/* 4. Quantité (unit_count) */}
            <TableCell className={cn('w-28 border-r p-0', cellFocusClass)}>
                <Input
                    type="number"
                    value={data.unit_count}
                    placeholder="0.00"
                    onChange={(e) => handleDataChange({ unit_count: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, 'text-center font-medium')}
                />
            </TableCell>


            {/* 6. Prix Unitaire (real_price) */}
            <TableCell className={cn('w-32 border-r p-0', cellFocusClass)}>
                <Input
                    type="number"
                    value={data.real_price}
                    placeholder="0.00"
                    onChange={(e) => handleDataChange({ real_price: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, 'pr-4 text-right')}
                />
            </TableCell>

            {/* 7. Total (total_diff) */}
            <TableCell className="w-36 bg-slate-50/30 px-6 text-right text-xs font-bold text-slate-900">
                {
                    rowTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                }
            </TableCell>

            {/* 8. Actions */}
            <TableCell className="relative w-12 border-l p-0 text-center print:hidden">
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
                                        ? 'text-emerald-600 hover:bg-emerald-50'
                                        : 'cursor-not-allowed text-slate-300',
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