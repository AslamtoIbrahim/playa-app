import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { router } from "@inertiajs/react";
import { Check, ChevronsUpDown, Loader2, Trash2, GripVertical } from "lucide-react";
import { KeyboardEvent, useEffect, useState } from "react";

// Drag & Drop Imports
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
import { Boat } from "@/types/boat";
import { Item } from "@/types/item";
import { InvoiceItem } from "@/types/invoice-item";
import { store, update } from "@/routes/invoices/items";

interface Props {
    invoiceId: number;
    item?: InvoiceItem;
    boats: Boat[];
    items: Item[];
    isNew?: boolean;
}

export default function InvoiceItemRow({ invoiceId, item, boats, items, isNew }: Props) {
    const [loading, setLoading] = useState(false);
    const [openBoat, setOpenBoat] = useState(false);
    const [openItem, setOpenItem] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Drag & Drop Logic ---
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: item?.id || 'new-row',
        disabled: isNew // السطر الجديد لا يتحرك
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: isDragging ? 'relative' : 'static' as any,
    };

    const [data, setData] = useState({
        boat_id: item?.boat_id || "",
        item_id: item?.item_id || "",
        unit_count: item?.unit_count || "",
        weight: item?.weight || "",
        unit_price: item?.unit_price || "",
        unit: item?.unit || "caisse",
    });

    // --- Calculations ---
    const selectedItem = items.find((i) => String(i.id) === String(data.item_id));
    const itemName = selectedItem?.name?.toLowerCase() || "";
    const isPoulpe = itemName.includes("poulpe") || itemName.includes("بولبو");

    useEffect(() => {
        if (data.item_id && isNew) {
            setData(prev => ({ ...prev, unit: isPoulpe ? "kg" : "caisse" }));
        }
    }, [data.item_id, isPoulpe, isNew]);

    useEffect(() => {
        if (data.unit_count) {
            const count = Number(data.unit_count);
            const calculatedWeight = data.unit === "kg" ? count : count * 21;
            setData(prev => ({ ...prev, weight: calculatedWeight.toString() }));
        } else {
            setData(prev => ({ ...prev, weight: "" }));
        }
    }, [data.unit_count, data.unit]);

    const amount = Number(data.unit_count) * Number(data.unit_price);

    const submitSave = (currentData = data, force = false) => {
        const hasRequiredFields = currentData.boat_id && currentData.item_id && currentData.unit_price;
        const hasValidQuantity = Number(currentData.unit_count) > 0;

        if (hasRequiredFields && hasValidQuantity && !loading) {
            if (isNew && !force) return;

            setLoading(true);

            // هنا التغيير: استعمال الـ Helpers بلاصة الـ Strings
            const url = isNew
                ? store(invoiceId)            // كيعطي: /invoices/{id}/items
                : update({ invoice: invoiceId, item: item!.id }); // كيعطي: /invoices/{id}/items/{item_id}

            router.post(url, {
                ...currentData,
                _method: isNew ? 'POST' : 'PATCH'
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    if (isNew) {
                        setData({ boat_id: "", item_id: "", unit_count: "", weight: "", unit_price: "", unit: "caisse" });
                        setSearchQuery("");
                    }
                },
                onFinish: () => setLoading(false),
            });
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLElement>, type?: 'boat' | 'item') => {
        if (type && !openBoat && !openItem) {
            const isCharacter = e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);
            if (isCharacter) {
                setSearchQuery(e.key);
                type === 'boat' ? setOpenBoat(true) : setOpenItem(true);
                return;
            }
        }

        if (openBoat || openItem) return;

        const isMovementKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

        if (e.key === 'Enter') {
            e.preventDefault();
            if (type) {
                setSearchQuery("");
                type === 'boat' ? setOpenBoat(true) : setOpenItem(true);
            } else {
                submitSave(data, true);
            }
            return;
        }

        if (isMovementKey) {
            e.preventDefault();
            const currentCell = (e.target as HTMLElement).closest('td');
            if (!currentCell) return;

            const focusElement = (el: Element | null) => {
                const target = el?.querySelector('input, button, select') as HTMLElement;
                if (target) {
                    target.focus();
                    if (target instanceof HTMLInputElement) target.select();
                }
            };

            if (e.key === 'ArrowRight') focusElement(currentCell.nextElementSibling);
            if (e.key === 'ArrowLeft') focusElement(currentCell.previousElementSibling);
            if (e.key === 'ArrowDown') {
                const nextRow = currentCell.parentElement?.nextElementSibling;
                if (nextRow) focusElement(nextRow.children[currentCell.cellIndex]);
            }
            if (e.key === 'ArrowUp') {
                const prevRow = currentCell.parentElement?.previousElementSibling;
                if (prevRow) focusElement(prevRow.children[currentCell.cellIndex]);
            }
        }
    };

    const cellFocusClass = "focus-within:ring-1 focus-within:ring-inset focus-within:ring-slate-300 focus-within:bg-slate-100/50 transition-all";
    const inputBaseClass = "border-none rounded-none h-10 text-xs shadow-none bg-transparent focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full font-normal";

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn(
                "group border-b transition-colors",
                isNew ? "bg-slate-50/50" : "hover:bg-slate-50/30",
                isDragging && "bg-blue-50/80 shadow-2xl opacity-80"
            )}
        >
            {/* 0. GRIP HANDLE (New Cell) */}
            <TableCell className="w-8 p-0 text-center border-r">
                {!isNew && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="w-full h-10 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
            </TableCell>

            {/* 1. BATEAU */}
            <TableCell className={cn("p-0 border-r w-[180px] relative", cellFocusClass)}>
                <Popover open={openBoat} onOpenChange={setOpenBoat}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            onKeyDown={(e) => handleKeyDown(e, 'boat')}
                            className="w-full justify-between h-10 text-xs rounded-none px-3 font-normal"
                        >
                            <span className={cn("truncate", !data.boat_id && "text-slate-400 italic")}>
                                {data.boat_id ? boats.find(b => String(b.id) === String(data.boat_id))?.name : "Choisir bateau..."}
                            </span>
                            <ChevronsUpDown className="h-3 w-3 opacity-20 shrink-0" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0" align="start" sideOffset={-1}>
                        <Command>
                            <CommandInput
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                placeholder="Rechercher..."
                                className="h-9 font-normal"
                            />
                            <CommandList>
                                <CommandEmpty>Aucun résultat.</CommandEmpty>
                                <CommandGroup>
                                    {boats.map((b) => (
                                        <CommandItem
                                            key={b.id}
                                            value={b.name}
                                            onSelect={() => {
                                                setData({ ...data, boat_id: b.id });
                                                setOpenBoat(false);
                                                setSearchQuery("");
                                            }}
                                            className="text-xs cursor-pointer font-normal"
                                        >
                                            <Check className={cn("mr-2 h-3 w-3", String(data.boat_id) === String(b.id) ? "opacity-100" : "opacity-0")} />
                                            {b.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </TableCell>

            {/* 2. ESPECES */}
            <TableCell className={cn("p-0 border-r w-[180px]", cellFocusClass)}>
                <Popover open={openItem} onOpenChange={setOpenItem}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            onKeyDown={(e) => handleKeyDown(e, 'item')}
                            className="w-full justify-between h-10 text-xs rounded-none px-3 font-normal"
                        >
                            <span className={cn("truncate", !data.item_id && "text-slate-400 italic")}>
                                {data.item_id ? items.find(i => String(i.id) === String(data.item_id))?.name : "Saisir espèce..."}
                            </span>
                            <ChevronsUpDown className="h-3 w-3 opacity-20 shrink-0" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0" align="start" sideOffset={-1}>
                        <Command>
                            <CommandInput
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                placeholder="Rechercher..."
                                className="h-9 font-normal"
                            />
                            <CommandList>
                                <CommandEmpty>Aucun résultat.</CommandEmpty>
                                <CommandGroup>
                                    {items.map((i) => (
                                        <CommandItem
                                            key={i.id}
                                            value={i.name}
                                            onSelect={() => {
                                                setData({ ...data, item_id: i.id });
                                                setOpenItem(false);
                                                setSearchQuery("");
                                            }}
                                            className="text-xs cursor-pointer font-normal"
                                        >
                                            <Check className={cn("mr-2 h-3 w-3", String(data.item_id) === String(i.id) ? "opacity-100" : "opacity-0")} />
                                            {i.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </TableCell>

            {/* 3. QTE / NC */}
            <TableCell className={cn("p-0 border-r w-24", cellFocusClass)}>
                <Input
                    type="number"
                    value={data.unit_count}
                    onChange={(e) => setData({ ...data, unit_count: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, "text-center text-slate-700")}
                />
            </TableCell>

            {/* 4. PRIX UNITAIRE */}
            <TableCell className={cn("p-0 border-r w-28", cellFocusClass)}>
                <Input
                    type="number"
                    value={data.unit_price}
                    onChange={(e) => setData({ ...data, unit_price: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className={cn(inputBaseClass, "text-right pr-4 text-slate-700")}
                />
            </TableCell>

            {/* 5. UNITE */}
            <TableCell className={cn("p-0 border-r w-28", cellFocusClass)}>
                <Select value={data.unit} onValueChange={(val) => setData({ ...data, unit: val })}>
                    <SelectTrigger
                        onKeyDown={handleKeyDown}
                        className="h-10 border-none rounded-none shadow-none text-[10px] font-normal uppercase focus:ring-0 bg-transparent px-3 w-full flex justify-between items-center"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="caisse" className="text-[10px] font-normal uppercase">Caisse</SelectItem>
                        <SelectItem value="kg" className="text-[10px] font-normal uppercase">Kg</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* 6. POIDS */}
            <TableCell className="p-0 border-r w-24 bg-slate-50/20">
                <Input type="number" value={data.weight} readOnly className={cn(inputBaseClass, "text-center text-slate-400 italic")} />
            </TableCell>

            {/* 7. VALEUR DH */}
            <TableCell className="text-right font-normal px-6 text-xs w-32 text-slate-900 bg-slate-50/10">
                {amount > 0 ? amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : "0.00"}
            </TableCell>

            {/* 8. ACTIONS */}
            <TableCell className="w-12 p-0 text-center">
                {loading ? <Loader2 className="h-3 w-3 animate-spin mx-auto text-slate-400" /> : (
                    <Button
                        variant="ghost" size="icon"
                        className={cn("h-10 w-full rounded-none transition-opacity", isNew ? "text-slate-400 hover:text-green-600" : "text-red-300 opacity-0 group-hover:opacity-100 hover:text-red-600")}
                        onClick={() => isNew ? submitSave(data, true) : router.delete(`/invoices/${invoiceId}/items/${item?.id}`)}
                    >
                        {isNew ? <Check className="h-4 w-4" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}