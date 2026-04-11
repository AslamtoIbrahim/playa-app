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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { cn } from "@/lib/utils";
import { store } from '@/routes/invoices'; 
import { Calendar } from './ui/calendar';

interface Props {
    accounts: { id: number; name: string }[];
    officeRooms: { id: number; name: string; city: string }[];
}

export default function AddInvoiceDialog({ accounts, officeRooms }: Props) {
    const [open, setOpen] = useState(false);
    
    const [accountComboOpen, setAccountComboOpen] = useState(false);
    const [officeComboOpen, setOfficeComboOpen] = useState(false);
    
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [selectedOfficeId, setSelectedOfficeId] = useState("");
    const [date, setDate] = useState<Date>(new Date());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une Facture
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="uppercase font-black text-slate-900">Nouvelle Facture</DialogTitle>
                    <DialogDescription>
                        Créez l'entête de la facture. Vous serez redirigé pour ajouter les articles.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Facture créée avec succès !');
                        setOpen(false);
                        setSelectedAccountId("");
                        setSelectedOfficeId("");
                        setDate(new Date());
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Inputs cachés pour le formulaire */}
                            <input type="hidden" name="account_id" value={selectedAccountId} />
                            <input type="hidden" name="office_room_id" value={selectedOfficeId} />
                            <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />

                            {/* Sélection du Compte */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Compte / Client</Label>
                                <Popover open={accountComboOpen} onOpenChange={setAccountComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", !selectedAccountId && "text-muted-foreground")}
                                        >
                                            {selectedAccountId
                                                ? accounts.find((acc) => acc.id.toString() === selectedAccountId)?.name
                                                : "Sélectionner un compte..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un compte..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun compte trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {accounts.map((acc) => (
                                                        <CommandItem
                                                            key={acc.id}
                                                            value={acc.name}
                                                            onSelect={() => {
                                                                setSelectedAccountId(acc.id.toString());
                                                                setAccountComboOpen(false);
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

                            {/* Sélection du Bureau / Ville */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Bureau / Ville</Label>
                                <Popover open={officeComboOpen} onOpenChange={setOfficeComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", !selectedOfficeId && "text-muted-foreground")}
                                        >
                                            {selectedOfficeId
                                                ? officeRooms.find((r) => r.id.toString() === selectedOfficeId)?.name
                                                : "Sélectionner un bureau..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un bureau..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun bureau trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {officeRooms.map((room) => (
                                                        <CommandItem
                                                            key={room.id}
                                                            value={room.name + " " + room.city}
                                                            onSelect={() => {
                                                                setSelectedOfficeId(room.id.toString());
                                                                setOfficeComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedOfficeId === room.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {room.name} ({room.city})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.office_room_id} />
                            </div>

                            {/* Date de Facturation */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Date de Facturation</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full justify-start text-left font-medium", !date && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "dd/MM/yyyy") : <span>Choisir une date</span>}
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
                                <InputError message={errors.date} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="submit" disabled={processing} className="w-full font-bold uppercase tracking-wider">
                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                                    Enregistrer la Facture
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}