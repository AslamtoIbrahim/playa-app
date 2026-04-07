import { Form } from "@inertiajs/react";
import { Pencil, Loader2, Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { update } from "@/routes/factures"; // Wayfinder route dyal factures

import type { Account } from "@/types/accounts";
import type { Facture } from "@/types/factures";

interface Props {
    facture: Facture;
    accounts: Account[];
}

export default function EditFactureDialog({ facture, accounts }: Props) {
    const [open, setOpen] = useState(false);
    const [comboOpen, setComboOpen] = useState(false);
    
    // States local l-custom inputs
    const [selectedAccountId, setSelectedAccountId] = useState(facture.account_id.toString());
    const [date, setDate] = useState<Date>(parseISO(facture.date));

    return (
        <Dialog open={open} onOpenChange={setOpen} key={`edit-facture-${facture.id}-${open}`}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Facture {facture.number}</DialogTitle>
                    <DialogDescription>
                        Update the invoice details below.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={update(facture.id).url}
                    method="post"
                    data={{
                        _method: 'patch',
                        account_id: selectedAccountId,
                        date: format(date, "yyyy-MM-dd"),
                        amount: facture.amount,
                        weight: facture.weight,
                    } as any}
                    onSuccess={() => {
                        toast.success('Facture updated! ✨');
                        setOpen(false);
                    }}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4 pt-4">
                            {/* Method Spoofing */}
                            <input type="hidden" name="_method" value="PATCH" />
                            <input type="hidden" name="account_id" value={selectedAccountId} />
                            <input type="hidden" name="date" value={format(date, "yyyy-MM-dd")} />

                            {/* Account Selector */}
                            <div className="grid gap-2">
                                <Label>Account</Label>
                                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between font-normal"
                                        >
                                            {selectedAccountId
                                                ? accounts.find((acc) => acc.id.toString() === selectedAccountId)?.name
                                                : "Select account..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search account..." />
                                            <CommandList>
                                                <CommandEmpty>No account found.</CommandEmpty>
                                                <CommandGroup>
                                                    {accounts.map((acc) => (
                                                        <CommandItem
                                                            key={acc.id}
                                                            value={acc.name}
                                                            onSelect={() => {
                                                                setSelectedAccountId(acc.id.toString());
                                                                setComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedAccountId === acc.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {acc.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date Picker */}
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "dd-MM-yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={(d) => d && setDate(d)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Weight */}
                                <div className="grid gap-2">
                                    <Label htmlFor="weight">Weight (KG)</Label>
                                    <Input 
                                        id="weight" 
                                        name="weight" 
                                        type="number" 
                                        step="0.01" 
                                        defaultValue={facture.weight ?? undefined} 
                                    />
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (DH)</Label>
                                <Input 
                                    id="amount" 
                                    name="amount" 
                                    type="number" 
                                    step="0.01" 
                                    required 
                                    defaultValue={facture.amount} 
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}