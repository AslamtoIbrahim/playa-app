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
import { Check, Loader2, GripVertical } from 'lucide-react';

// Drag & Drop
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types & Logic
import { Boat } from '@/types/boat';
import { Item } from '@/types/item';
import { InvoiceItem } from '@/types/invoice-item';
import { Checkbox } from './ui/checkbox';
import { RowActions } from './row-actions';
import { useInvoiceItem } from '@/hooks/use-invoice-item';
import { SearchSelect } from './search-select';

interface Props {
    invoiceId: number;
    item?: InvoiceItem;
    boats: Boat[];
    items: Item[];
    isNew?: boolean;
    selected?: boolean;
    onSelectChange?: (checked: boolean) => void;
}

export default function InvoiceItemRow({
    invoiceId,
    item,
    boats,
    items,
    isNew,
    selected,
    onSelectChange,
}: Props) {
    const {
        data,
        setData,
        loading,
        openBoat,
        setOpenBoat,
        openItem,
        setOpenItem,
        weight,
        amount,
        isReadyToSave,
        submitSave,
        handleKeyDown,
    } = useInvoiceItem({ invoiceId, item, isNew });

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

    const cellFocusClass = 'focus-within:ring-1 focus-within:ring-inset focus-within:ring-slate-300 focus-within:bg-slate-100/50 transition-all';
    const inputBaseClass = 'border-none rounded-none h-10 text-xs shadow-none bg-transparent focus-visible:ring-0 w-full font-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn(
                'group border-b',
                isNew ? 'bg-slate-50/50' : 'hover:bg-slate-50/30',
                isDragging && 'bg-blue-50/80 shadow-2xl',
                selected && 'bg-blue-50/50',
                isNew && 'print:hidden',
            )}
        >
            {/* Drag Handle */}
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

            {/* Checkbox */}
            <TableCell className="w-8 border-r p-0 text-center print:hidden">
                {!isNew && (
                    <div className="flex h-10 items-center justify-center">
                        <Checkbox
                            checked={selected || false}
                            onCheckedChange={(checked: boolean) => {
                                onSelectChange?.(checked);
                            }}
                            className="h-4 w-4 border-slate-300"
                        />
                    </div>
                )}
            </TableCell>

            {/* BATEAU */}
            <TableCell className={cn('w-45 border-r p-0', cellFocusClass)}>
                <SearchSelect
                    value={data.boat_id}
                    options={boats}
                    placeholder="Choisir bateau..."
                    open={openBoat}
                    onOpenChange={setOpenBoat}
                    onKeyDown={(e) => {
                        handleKeyDown(e, 'boat');
                    }}
                    onSelect={(id) => {
                        const updated = { ...data, boat_id: id };
                        setData(updated);
                        setOpenBoat(false);

                        if (isReadyToSave(updated)) {
                            submitSave(updated);
                        }
                    }}
                />
            </TableCell>

            {/* ESPECES */}
            <TableCell className={cn('w-45 border-r p-0', cellFocusClass)}>
                <SearchSelect
                    value={data.item_id}
                    options={items}
                    placeholder="Saisir espèce..."
                    open={openItem}
                    onOpenChange={setOpenItem}
                    onKeyDown={(e) => {
                        handleKeyDown(e, 'item');
                    }}
                    onSelect={(id) => {
                        const selectedItem = items.find(i => String(i.id) === String(id));
                        const isPoulpe = selectedItem?.name?.toLowerCase().includes('poulpe') || selectedItem?.name?.toLowerCase().includes('بولبو');
                        
                        const updated = {
                            ...data,
                            item_id: id,
                            unit: isPoulpe ? 'kg' : 'caisse'
                        };
                        
                        setData(updated);
                        setOpenItem(false);

                        if (isReadyToSave(updated)) {
                            submitSave(updated);
                        }
                    }}
                />
            </TableCell>

            {/* UNIT COUNT */}
            <TableCell className={cn('w-24 border-r p-0', cellFocusClass)}>
                <Input
                    type="number"
                    value={data.unit_count}
                    onChange={(e) => {
                        setData({ ...data, unit_count: e.target.value });
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, 'text-center')}
                />
            </TableCell>

            {/* UNIT PRICE */}
            <TableCell className={cn('w-28 border-r p-0', cellFocusClass)}>
                <Input
                    type="number"
                    value={data.unit_price}
                    onChange={(e) => {
                        setData({ ...data, unit_price: e.target.value });
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, 'pr-4 text-right')}
                />
            </TableCell>

            {/* UNIT SELECT */}
            <TableCell className={cn('w-28 border-r p-0', cellFocusClass)}>
                <Select
                    value={data.unit}
                    onValueChange={(val) => {
                        const updated = { ...data, unit: val };
                        setData(updated);

                        if (isReadyToSave(updated)) {
                            submitSave(updated);
                        }
                    }}
                >
                    <SelectTrigger
                        onKeyDown={handleKeyDown}
                        className="h-10 w-full rounded-none border-none bg-transparent px-3 text-[10px] uppercase shadow-none focus:ring-0"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="caisse" className="text-[10px] uppercase">Caisse</SelectItem>
                        <SelectItem value="kg" className="text-[10px] uppercase">Kg</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* WEIGHT (ReadOnly) */}
            <TableCell className="w-24 border-r bg-slate-50/20 p-0">
                <Input
                    type="number"
                    value={weight}
                    readOnly
                    className={cn(inputBaseClass, 'text-center text-slate-400 italic')}
                />
            </TableCell>

            {/* AMOUNT */}
            <TableCell className="w-32 bg-slate-50/10 px-6 text-right text-xs font-normal text-slate-900">
                {amount > 0
                    ? amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                    : '0.00'}
            </TableCell>

            {/* ACTIONS */}
            <TableCell className="relative w-12 border-l p-0 text-center print:hidden">
                {loading ? (
                    <div className="flex h-10 w-full items-center justify-center">
                        <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
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
                                        ? 'text-green-600 hover:bg-green-50'
                                        : 'cursor-not-allowed text-slate-300',
                                )}
                                onClick={() => {
                                    if (isReadyToSave()) {
                                        submitSave(data);
                                    }
                                }}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="w-full opacity-0 transition-opacity group-hover:opacity-100">
                                <RowActions
                                    invoiceId={invoiceId}
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