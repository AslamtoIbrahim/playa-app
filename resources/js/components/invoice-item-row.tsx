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
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { router } from "@inertiajs/react";
import { Check, ChevronsUpDown, Loader2, Trash2 } from "lucide-react";
import { KeyboardEvent, useEffect, useState, useRef } from "react";

interface Props {
    invoiceId: number;
    item?: any;
    boats: any[];
    items: any[];
    isNew?: boolean;
}

export default function InvoiceItemRow({ invoiceId, item, boats, items, isNew }: Props) {
    const [loading, setLoading] = useState(false);
    const [openBoat, setOpenBoat] = useState(false);
    const [openItem, setOpenItem] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [data, setData] = useState({
        boat_id: item?.boat_id || "",
        item_id: item?.item_id || "",
        unit_count: item?.unit_count || "",
        weight: item?.weight || "",
        unit_price: item?.unit_price || "",
        unit: item?.unit || "caisse",
    });

    const selectedItem = items.find((i) => i.id == data.item_id);
    const itemName = selectedItem?.name?.toLowerCase() || "";
    const isPoulpe = itemName.includes("poulpe") || itemName.includes("بولبو");

    useEffect(() => {
        if (isPoulpe) {
            setData(prev => ({ ...prev, unit: "kg", weight: prev.unit_count }));
        } else if (data.item_id) {
            const calculatedWeight = data.unit_count ? (Number(data.unit_count) * 21).toString() : "";
            setData(prev => ({ ...prev, unit: "caisse", weight: calculatedWeight }));
        }
    }, [data.item_id, data.unit_count, isPoulpe]);

    const amount = Number(data.unit_count) * Number(data.unit_price);

    // دالة الحفظ مع التحقق
    const submitSave = (currentData = data) => {
        const hasRequiredFields = currentData.boat_id && currentData.item_id && currentData.unit_price;
        const hasValidQuantity = Number(currentData.unit_count) > 0;

        if (hasRequiredFields && hasValidQuantity && !loading) {
            setLoading(true);
            const url = isNew ? `/invoices/${invoiceId}/items` : `/invoices/${invoiceId}/items/${item.id}`;

            router.post(url, {
                ...currentData,
                _method: isNew ? 'POST' : 'PATCH'
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    if (isNew) {
                        setData({ boat_id: "", item_id: "", unit_count: "", weight: "", unit_price: "", unit: "caisse" });
                    }
                },
                onFinish: () => setLoading(false),
            });
        }
    };

    const handleKeyDown = (e: KeyboardEvent<any>, type?: 'boat' | 'item') => {
        // إذا كانت القائمة مفتوحة، Enter سيختار العنصر (هذا سلوك افتراضي للـ CommandItem)
        if (openBoat || openItem) return;

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();

        if (type && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setSearchQuery(e.key);
            type === 'boat' ? setOpenBoat(true) : setOpenItem(true);
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (type) {
                setSearchQuery("");
                type === 'boat' ? setOpenBoat(true) : setOpenItem(true);
            } else {
                submitSave();
            }
            return;
        }

        const currentCell = (e.target as HTMLElement).closest('td');
        if (!currentCell) return;

        const focusElement = (el: Element | null) => {
            (el?.querySelector('input, button') as HTMLElement)?.focus();
        };

        if (e.key === 'ArrowRight') focusElement(currentCell.nextElementSibling);
        if (e.key === 'ArrowLeft') focusElement(currentCell.previousElementSibling);

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const cellIndex = Array.from(currentCell.parentElement!.children).indexOf(currentCell);
            const targetRow = e.key === 'ArrowDown'
                ? currentCell.parentElement?.nextElementSibling
                : currentCell.parentElement?.previousElementSibling;

            if (targetRow) focusElement(targetRow.children[cellIndex]);
        }
    };

    return (
        <TableRow className="group border-b hover:bg-slate-50 transition-colors">
            {/* 1. BATEAU */}
            <TableCell className="p-0 border-r w-[180px]">
                <Popover open={openBoat} onOpenChange={setOpenBoat}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" onKeyDown={(e) => handleKeyDown(e, 'boat')} className="w-full justify-between h-10 font-normal text-xs rounded-none shadow-none">
                            <span className="truncate">{data.boat_id ? boats.find(b => b.id == data.boat_id)?.name : "Bateau"}</span>
                            <ChevronsUpDown className="h-3 w-3 opacity-30" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search..." className="h-8" value={searchQuery} onValueChange={setSearchQuery} />
                            <CommandList>
                                <CommandEmpty>No results.</CommandEmpty>
                                <CommandGroup>
                                    {boats.map((b) => (
                                        <CommandItem key={b.id} onSelect={() => { 
                                            const newData = { ...data, boat_id: b.id };
                                            setData(newData); 
                                            setOpenBoat(false); 
                                            setSearchQuery("");
                                            submitSave(newData); // حفظ تلقائي بعد الاختيار
                                        }}>
                                            <Check className={cn("mr-2 h-4 w-4", data.boat_id == b.id ? "opacity-100" : "opacity-0")} />
                                            {b.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </TableCell>

            {/* 2. ARTICLE */}
            <TableCell className="p-0 border-r w-[180px]">
                <Popover open={openItem} onOpenChange={setOpenItem}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" onKeyDown={(e) => handleKeyDown(e, 'item')} className="w-full justify-between h-10 font-normal text-xs rounded-none shadow-none">
                            <span className="truncate">{data.item_id ? items.find(i => i.id == data.item_id)?.name : "Article"}</span>
                            <ChevronsUpDown className="h-3 w-3 opacity-30" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search..." className="h-8" value={searchQuery} onValueChange={setSearchQuery} />
                            <CommandList>
                                <CommandEmpty>No results.</CommandEmpty>
                                <CommandGroup>
                                    {items.map((i) => (
                                        <CommandItem key={i.id} onSelect={() => { 
                                            const newData = { ...data, item_id: i.id };
                                            setData(newData); 
                                            setOpenItem(false); 
                                            setSearchQuery("");
                                            submitSave(newData); // حفظ تلقائي بعد الاختيار
                                        }}>
                                            <Check className={cn("mr-2 h-4 w-4", data.item_id == i.id ? "opacity-100" : "opacity-0")} />
                                            {i.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </TableCell>

            {/* 3. QTE / BOX */}
            <TableCell className="p-0 border-r w-24">
                <Input
                    type="number"
                    value={data.unit_count}
                    onChange={(e) => setData({ ...data, unit_count: e.target.value })}
                    onBlur={() => submitSave()}
                    onKeyDown={handleKeyDown}
                    className="border-none rounded-none text-center h-10 text-xs shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </TableCell>

            {/* 4. PRIX UNIT */}
            <TableCell className="p-0 border-r w-28">
                <Input
                    type="number"
                    value={data.unit_price}
                    onChange={(e) => setData({ ...data, unit_price: e.target.value })}
                    onBlur={() => submitSave()}
                    onKeyDown={handleKeyDown}
                    className="border-none rounded-none text-right h-10 text-xs shadow-none pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </TableCell>

            {/* 5. UNITE */}
            <TableCell className="p-0 border-r w-16 text-center text-[10px] font-bold text-slate-400 uppercase bg-slate-50/30">
                {data.unit}
            </TableCell>

            {/* 6. POIDS */}
            <TableCell className="p-0 border-r w-24">
                <Input
                    type="number"
                    value={data.weight}
                    readOnly
                    className="border-none rounded-none text-center h-10 text-xs shadow-none bg-slate-50/50 text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </TableCell>

            {/* 7. TOTAL HT */}
            <TableCell className="text-right font-bold text-blue-700 px-6 text-xs bg-blue-50/10 w-32">
                {amount > 0 ? amount.toFixed(2) : "0.00"}
            </TableCell>

            <TableCell className="w-10 p-0 text-center">
                {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto text-blue-500" />
                ) : !isNew && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-full rounded-none text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                        onClick={() => router.delete(`/invoices/${invoiceId}/items/${item.id}`, { preserveScroll: true })}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}