import { Form } from '@inertiajs/react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { cn } from "@/lib/utils";
import { store } from '@/routes/factures';
import type { Account } from '@/types/accounts';
import { Calendar } from './ui/calendar';

interface Props {
    accounts: Account[];
}

export default function AddFactureDialog({ accounts }: Props) {
    const [open, setOpen] = useState(false);
    const [comboOpen, setComboOpen] = useState(false);
    
    // States for custom inputs
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [date, setDate] = useState<Date>(new Date());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Facture
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Add Facture</DialogTitle>
                    <DialogDescription>
                        Select an account and fill in the amounts. Invoice number is generated automatically.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    resetOnSuccess={['amount', 'weight']}
                    onSuccess={() => {
                        toast.success('Facture has been created!');
                        setOpen(false);
                        setSelectedAccountId("");
                        setDate(new Date());
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Hidden Inputs for custom components */}
                            <input type="hidden" name="account_id" value={selectedAccountId} />
                            <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />

                            {/* Account Selection (Combobox) */}
                            <div className="grid gap-2">
                                <Label>Account</Label>
                                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-normal", !selectedAccountId && "text-muted-foreground")}
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
                                <InputError message={errors.account_id} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date Picker (Shadcn UI) */}
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
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
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.date} />
                                </div>

                                {/* Weight */}
                                <div className="grid gap-2">
                                    <Label htmlFor="weight">Weight (KG)</Label>
                                    <Input id="weight" name="weight" type="number" step="0.01" placeholder="0.00" />
                                    <InputError message={errors.weight} />
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (DH)</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
                                <InputError message={errors.amount} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing && <Spinner />}
                                    Save Facture
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}