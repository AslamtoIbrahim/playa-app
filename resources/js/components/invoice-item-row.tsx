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
import { InvoiceRowActions } from './invoice-row-actions';
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
    onOpenDifference: (item: InvoiceItem) => void;
}

export default function InvoiceItemRow({
    invoiceId,
    item,
    boats,
    items,
    isNew,
    selected,
    onSelectChange,
    onOpenDifference,
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

    const cellFocusClass = 'focus-within:ring-1 focus-within:ring-inset focus-within:ring-slate-300 focus-within:bg-slate-100/50 dark:focus-within:ring-neutral-700 dark:focus-within:bg-neutral-800/50 transition-all';

    const inputBaseClass = 'border-none rounded-none h-10 text-xs shadow-none bg-transparent focus-visible:ring-0 w-full font-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-neutral-100';

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn(
                'group border-b border-slate-100 dark:border-neutral-800',
                isNew ? 'bg-slate-50/50 dark:bg-neutral-900/60' : 'hover:bg-slate-50/30 dark:hover:bg-neutral-900/40',
                isDragging && 'bg-blue-50/80 shadow-2xl dark:bg-blue-950/60',
                selected && 'bg-blue-50/50 dark:bg-blue-950/40',
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

            <TableCell className={cn('w-45 border-r border-slate-100 p-0 dark:border-neutral-800', cellFocusClass)}>
                <SearchSelect
                    value={data.boat_id}
                    options={boats}
                    placeholder="Choisir bateau..."
                    open={openBoat}
                    onOpenChange={setOpenBoat}
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
            </TableCell>

            <TableCell className={cn('w-45 border-r border-slate-100 p-0 dark:border-neutral-800', cellFocusClass)}>
                <SearchSelect
                    value={data.item_id}
                    options={items}
                    placeholder="Saisir espèce..."
                    open={openItem}
                    onOpenChange={setOpenItem}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e, 'item');
                        }
                    }}
                    onSelect={(id) => {
                        {
                            const selectedItem = items.find(i => String(i.id) === String(id));
                            const isPoulpe = selectedItem?.name?.toLowerCase().includes('poulpe') || selectedItem?.name?.toLowerCase().includes('بولبو');

                            handleDataChange({
                                item_id: id,
                                unit: isPoulpe ? 'kg' : 'caisse'
                            });

                            setOpenItem(false);
                        }
                    }}
                />
            </TableCell>



            <TableCell className={cn('w-24 border-r border-slate-100 p-0 dark:border-neutral-800', cellFocusClass)}>
                <Input
                    type="number"
                    value={data.unit_count}
                    onChange={(e) => {
                        {
                            handleDataChange({ unit_count: e.target.value });
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, 'text-center')}
                />
            </TableCell>

            <TableCell className={cn('w-28 border-r border-slate-100 p-0 dark:border-neutral-800', cellFocusClass)}>
                <Input
                    type="number"
                    value={data.unit_price}
                    onChange={(e) => {
                        {
                            handleDataChange({ unit_price: e.target.value });
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, 'pr-4 text-right')}
                />
            </TableCell>

            <TableCell className={cn('w-28 border-r border-slate-100 p-0 dark:border-neutral-800', cellFocusClass)}>
                <Select
                    value={data.unit}
                    onValueChange={(val) => {
                        {
                            handleDataChange({ unit: val });
                        }
                    }}
                >
                    <SelectTrigger
                        onKeyDown={handleKeyDown}
                        className="h-10 w-full rounded-none border-none bg-transparent px-3 text-[10px] uppercase shadow-none focus:ring-0 text-slate-900 dark:text-neutral-100"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
                        <SelectItem value="caisse" className="text-[10px] uppercase dark:focus:bg-neutral-800">Caisse</SelectItem>
                        <SelectItem value="kg" className="text-[10px] uppercase dark:focus:bg-neutral-800">Kg</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* <TableCell className="w-24 border-r bg-slate-50/20 p-0">
                <Input
                    type="number"
                    value={weight}
                    readOnly
                    className={cn(inputBaseClass, 'text-center text-slate-400 italic')}
                />
            </TableCell> */}

            {/* 7. POIDS (Editable) */}
            <TableCell className={cn('w-24 border-r border-slate-100 p-0 dark:border-neutral-800', cellFocusClass)}>
                <Input
                    type="number"
                    value={weight}
                    onChange={(e) => {
                        {
                            handleDataChange({ weight: e.target.value });
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        inputBaseClass,
                        'text-center font-medium',
                        data.unit === 'caisse' && Number(weight) !== (Number(data.unit_count) * 21)
                            ? 'text-blue-600 font-bold dark:text-blue-400'
                            : 'text-slate-500 dark:text-neutral-400'
                    )}
                />
            </TableCell>

            {/* BOX - الحقل الجديد */}
            <TableCell className={cn('w-20 border-r border-slate-100 p-0 dark:border-neutral-800', cellFocusClass)}>
                <Input
                    type="number"
                    value={displayBox}
                    readOnly={data.unit === 'caisse'}
                    onChange={(e) => {
                        {
                            handleDataChange({ box: e.target.value });
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        inputBaseClass,
                        'text-center font-bold text-blue-900 dark:text-blue-300',
                        data.unit === 'caisse' && 'text-slate-500 font-normal dark:text-neutral-400'
                    )}
                />
            </TableCell>

            <TableCell className="w-32 bg-slate-50/10 px-6 text-right text-xs font-normal text-slate-900 dark:bg-neutral-900/20 dark:text-neutral-100">
                {amount > 0
                    ? amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                    : '0.00'}
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
                                />
                            </div>
                        )}
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}