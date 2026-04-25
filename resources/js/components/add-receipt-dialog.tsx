import { Form } from '@inertiajs/react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Plus, Receipt, Ship, X } from 'lucide-react';
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
import { cn, commandItemClass } from "@/lib/utils";
import { store } from '@/routes/receipts'; 
import { Calendar } from './ui/calendar';
import { DailySession } from '@/types/daily-session';
import { Customer } from '@/types/customers';
import { Boat } from '@/types/boat';

interface Props {
    customers: Customer[];
    sessions: DailySession[];
    boats: Boat[];
}

export default function AddReceiptDialog({ customers, sessions, boats }: Props) {
    const [open, setOpen] = useState<boolean>(false);

    const [customerComboOpen, setCustomerComboOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);
    const [boatComboOpen, setBoatComboOpen] = useState<boolean>(false);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [selectedBoatId, setSelectedBoatId] = useState<string>("");
    const [date, setDate] = useState<Date>(new Date());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Nouveau Bon de Réception
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="uppercase font-black text-slate-900 flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-blue-600" /> Nouveau Bon
                    </DialogTitle>
                    <DialogDescription>
                        Créez l'entête du bon de réception. Vous pourrez ajouter les articles après validation.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Bon de réception créé avec succès !');
                        setOpen(false);
                        setSelectedCustomerId("");
                        setSelectedSessionId("");
                        setSelectedBoatId("");
                        setDate(new Date());
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="customer_id" value={selectedCustomerId} />
                            <input type="hidden" name="session_id" value={selectedSessionId} />
                            <input type="hidden" name="boat_id" value={selectedBoatId} />
                            <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />

                            {/* Date Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Date de Réception</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full justify-start text-left font-medium", !date && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                            {date ? format(date, "dd/MM/yyyy") : <span>Choisir une date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d: Date | undefined) => {
                                                if (d) {
                                                    setDate(d);
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.date} />
                            </div>

                            {/* Session Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Journée d'exploitation</Label>
                                <Popover open={sessionComboOpen} onOpenChange={setSessionComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", !selectedSessionId && "text-muted-foreground", errors.session_id && "border-destructive")}
                                        >
                                            {selectedSessionId
                                                ? format(new Date(sessions.find((s) => s.id.toString() === selectedSessionId)?.session_date || ""), "dd MMMM yyyy")
                                                : "Sélectionner la journée..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher une journée..." />
                                            <CommandList>
                                                <CommandEmpty>Aucune journée trouvée.</CommandEmpty>
                                                <CommandGroup>
                                                    {sessions.map((session) => (
                                                        <CommandItem
                                                            className={commandItemClass}
                                                            key={session.id}
                                                            value={session.session_date}
                                                            onSelect={() => {
                                                                setSelectedSessionId(session.id.toString());
                                                                setSessionComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedSessionId === session.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {format(new Date(session.session_date), "dd/MM/yyyy")}
                                                            <span className="ml-auto text-[10px] bg-slate-100 px-1 rounded uppercase">{session.status}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.session_id} />
                            </div>

                            {/* Customer Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Client / Fournisseur</Label>
                                <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", !selectedCustomerId && "text-muted-foreground", errors.customer_id && "border-destructive")}
                                        >
                                            {selectedCustomerId 
                                                ? customers.find(c => c.id.toString() === selectedCustomerId)?.name 
                                                : "Sélectionner un client..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un client..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {customers.map((customer) => (
                                                        <CommandItem
                                                            className={commandItemClass}
                                                            key={customer.id}
                                                            value={customer.name}
                                                            onSelect={() => {
                                                                setSelectedCustomerId(customer.id.toString());
                                                                setCustomerComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === customer.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {customer.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.customer_id} />
                            </div>

                            {/* Boat Field (Optional) */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500 flex justify-between">
                                    Bateau (Optionnel)
                                    {selectedBoatId && (
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedBoatId("")}
                                            className="text-[10px] text-red-500 hover:underline flex items-center gap-1"
                                        >
                                            <X className="h-3 w-3" /> Effacer
                                        </button>
                                    )}
                                </Label>
                                <Popover open={boatComboOpen} onOpenChange={setBoatComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium bg-slate-50/50", !selectedBoatId && "text-muted-foreground")}
                                        >
                                            <div className="flex items-center">
                                                <Ship className="mr-2 h-4 w-4 text-slate-400" />
                                                {selectedBoatId 
                                                    ? boats.find(b => b.id.toString() === selectedBoatId)?.name 
                                                    : "Sans bateau (Client direct)"}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un bateau..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun bateau trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {boats.map((boat) => (
                                                        <CommandItem
                                                            className={commandItemClass}
                                                            key={boat.id}
                                                            value={boat.name}
                                                            onSelect={() => {
                                                                setSelectedBoatId(boat.id.toString());
                                                                setBoatComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedBoatId === boat.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {boat.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.boat_id} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="submit" disabled={processing} className="w-full font-bold uppercase tracking-wider bg-slate-900">
                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                                    Enregistrer et continuer
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}