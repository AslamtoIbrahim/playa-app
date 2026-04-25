import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Clock,
    Pencil,
    Ship,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput as SearchInput,
} from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { cn, commandItemClass } from '@/lib/utils';

import { update } from '@/routes/receipts'; 
import { Receipt } from '@/types/receipt';
import { Customer } from '@/types/customers';
import { DailySession } from '@/types/daily-session';
import { Boat } from '@/types/boat';

interface Props {
    receipt: Receipt & { boat?: Boat | null };
    customers: Customer[];
    sessions: DailySession[];
    boats: Boat[];
    trigger?: React.ReactNode;
}

export default function EditReceiptDialog({
    receipt,
    customers,
    sessions,
    boats,
    trigger,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [customerComboOpen, setCustomerComboOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);
    const [boatComboOpen, setBoatComboOpen] = useState<boolean>(false);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        customers.find((c) => c.id === receipt.customer_id) || null
    );

    const [selectedSession, setSelectedSession] = useState<DailySession | null>(
        sessions.find((s) => Number(s.id) === Number(receipt.session_id)) || null
    );

    const [selectedBoat, setSelectedBoat] = useState<Boat | null>(
        boats.find((b) => b.id === receipt.boat_id) || null
    );

    const [date, setDate] = useState<Date>(parseISO(receipt.date));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-blue-600" /> Modifier le Bon #{receipt.id}
                    </DialogTitle>
                    <DialogDescription>
                        Modifier les détails du bon de réception.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(receipt.id)}
                    onSuccess={() => {
                        toast.success('Bon mis à jour ! ✨');
                        setOpen(false);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="customer_id" value={selectedCustomer?.id || ''} />
                            <input type="hidden" name="session_id" value={selectedSession?.id || ''} />
                            <input type="hidden" name="boat_id" value={selectedBoat?.id || ''} />
                            <input type="hidden" name="date" value={date ? format(date, 'yyyy-MM-dd') : ''} />

                            {/* Date Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Date du bon</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-medium">
                                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                            {date ? format(date, 'dd/MM/yyyy') : <span>Choisir une date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                            </div>

                            {/* Session Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Session</Label>
                                <Popover open={sessionComboOpen} onOpenChange={setSessionComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between font-medium">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 opacity-50" />
                                                {selectedSession ? format(parseISO(selectedSession.session_date), 'dd MMMM yyyy') : 'Choisir une session...'}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <SearchInput placeholder="Rechercher..." />
                                            <CommandList>
                                                <CommandGroup>
                                                    {sessions.map((session) => (
                                                        <CommandItem
                                                            key={session.id}
                                                            className={commandItemClass}
                                                            onSelect={() => {
                                                                setSelectedSession(session);
                                                                setSessionComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedSession?.id === session.id ? "opacity-100" : "opacity-0")} />
                                                            {format(parseISO(session.session_date), 'dd/MM/yyyy')}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.session_id && <p className="text-sm text-red-500">{errors.session_id}</p>}
                            </div>

                            {/* Customer Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Client</Label>
                                <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between font-medium">
                                            {selectedCustomer ? selectedCustomer.name : 'Sélectionner un client...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <SearchInput placeholder="Rechercher..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {customers.map((customer) => (
                                                        <CommandItem
                                                            key={customer.id}
                                                            className={commandItemClass}
                                                            onSelect={() => {
                                                                setSelectedCustomer(customer);
                                                                setCustomerComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0")} />
                                                            {customer.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.customer_id && <p className="text-sm text-red-500">{errors.customer_id}</p>}
                            </div>

                            {/* Boat Field (Optional) */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                    Bateau (Optionnel)
                                    {selectedBoat && (
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedBoat(null)}
                                            className="text-[10px] text-red-500 hover:underline flex items-center gap-1"
                                        >
                                            <X className="h-3 w-3" /> Détacher
                                        </button>
                                    )}
                                </Label>
                                <Popover open={boatComboOpen} onOpenChange={setBoatComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between font-medium bg-slate-50/30", !selectedBoat && "text-muted-foreground")}>
                                            <div className="flex items-center">
                                                <Ship className="mr-2 h-4 w-4 text-slate-400" />
                                                {selectedBoat ? selectedBoat.name : 'Sans bateau (Client direct)'}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <SearchInput placeholder="Rechercher un bateau..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun bateau trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {boats.map((boat) => (
                                                        <CommandItem
                                                            key={boat.id}
                                                            className={commandItemClass}
                                                            onSelect={() => {
                                                                setSelectedBoat(boat);
                                                                setBoatComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedBoat?.id === boat.id ? "opacity-100" : "opacity-0")} />
                                                            {boat.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.boat_id && <p className="text-sm text-red-500">{errors.boat_id}</p>}
                            </div>

                            {/* Summary View */}
                            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 border border-dashed">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Quantité</span>
                                    <p className="text-sm font-bold">{receipt.quantity} units</p>
                                </div>
                                <div className="border-l pl-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total DH</span>
                                    <p className="text-sm font-bold text-blue-600">{receipt.total_amount} DH</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Annuler</Button>
                                <Button type="submit" disabled={processing} className="font-bold bg-slate-900">
                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                                    Mettre à jour
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}