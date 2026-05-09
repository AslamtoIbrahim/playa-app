import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    MapPin,
    Pencil,
    Ship,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
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

// Wayfinder import
import { update } from '@/routes/receipts';

import { Boat } from '@/types/boat';
import { Customer } from '@/types/customer';
import { SessionZone } from '@/types/session-zone';
import { Receipt } from '@/types/receipt';

interface Props {
    receipt: Receipt & { boat?: Boat | null };
    customers: Customer[];
    sessionZones: SessionZone[]; // التغيير هنا
    boats: Boat[];
    trigger?: React.ReactNode;
}

export default function EditReceiptDialog({
    receipt,
    customers,
    sessionZones,
    boats,
    trigger,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [customerComboOpen, setCustomerComboOpen] = useState<boolean>(false);
    const [sessionZoneComboOpen, setSessionZoneComboOpen] = useState<boolean>(false);
    const [boatComboOpen, setBoatComboOpen] = useState<boolean>(false);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
        receipt.customer_id?.toString() || ""
    );

    const [selectedSessionZoneId, setSelectedSessionZoneId] = useState<string>(
        receipt.session_zone_id?.toString() || ""
    );

    const [selectedBoatId, setSelectedBoatId] = useState<string>(
        receipt.boat_id?.toString() || ""
    );

    const [date, setDate] = useState<Date>(parseISO(receipt.date));

    const getSessionZoneLabel = (id: string) => {
        const sz = sessionZones.find((s) => s.id.toString() === id);

        if (!sz) {
            return "";
        }

        const dateStr = sz.daily_session?.session_date 
            ? format(parseISO(sz.daily_session.session_date), 'dd/MM/yyyy') 
            : 'N/A';

        return `${dateStr} - ${sz.zone?.name}`;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-black uppercase text-slate-900">
                        <Pencil className="h-5 w-5 text-blue-600" /> Modifier le
                        Bon #{receipt.id}
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
                            <input
                                type="hidden"
                                name="customer_id"
                                value={selectedCustomerId}
                            />
                            <input
                                type="hidden"
                                name="session_zone_id"
                                value={selectedSessionZoneId}
                            />
                            <input
                                type="hidden"
                                name="boat_id"
                                value={selectedBoatId}
                            />
                            <input
                                type="hidden"
                                name="date"
                                value={date ? format(date, 'yyyy-MM-dd') : ''}
                            />

                            {/* Date Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                    Date du bon
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full justify-start text-left font-medium", !date && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                            {date ? (
                                                format(date, 'dd/MM/yyyy')
                                            ) : (
                                                <span>Choisir une date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => {
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

                            {/* SessionZone Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                    Journée & Zone
                                </Label>
                                <Popover
                                    open={sessionZoneComboOpen}
                                    onOpenChange={setSessionZoneComboOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between font-medium text-left h-auto py-2",
                                                !selectedSessionZoneId && "text-muted-foreground",
                                                errors.session_zone_id && "border-destructive"
                                            )}
                                        >
                                            <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                                {selectedSessionZoneId ? (
                                                    <span className="truncate capitalize">{getSessionZoneLabel(selectedSessionZoneId)}</span>
                                                ) : (
                                                    "Choisir une session & zone..."
                                                )}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <SearchInput placeholder="Rechercher une journée ou zone..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {sessionZones.map((sz) => (
                                                        <CommandItem
                                                            key={sz.id}
                                                            className={commandItemClass}
                                                            value={`${sz.daily_session?.session_date} ${sz.zone?.name}`}
                                                            onSelect={() => {
                                                                setSelectedSessionZoneId(sz.id.toString());
                                                                setSessionZoneComboOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    selectedSessionZoneId === sz.id.toString()
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">
                                                                    {sz.daily_session ? format(parseISO(sz.daily_session.session_date), "dd/MM/yyyy") : 'N/A'}
                                                                </span>
                                                                <span className="text-xs text-slate-700 capitalize font-medium flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" /> {sz.zone?.name}
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.session_zone_id} />
                            </div>

                            {/* Customer Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                    Client
                                </Label>
                                <Popover
                                    open={customerComboOpen}
                                    onOpenChange={setCustomerComboOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", errors.customer_id && "border-destructive")}
                                        >
                                            {selectedCustomerId
                                                ? customers.find(c => c.id.toString() === selectedCustomerId)?.name
                                                : 'Sélectionner un client...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <SearchInput placeholder="Rechercher..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    Aucun client trouvé.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {customers.map((customer) => (
                                                        <CommandItem
                                                            key={customer.id}
                                                            className={commandItemClass}
                                                            onSelect={() => {
                                                                setSelectedCustomerId(customer.id.toString());
                                                                setCustomerComboOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    selectedCustomerId === customer.id.toString()
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
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
                                <Label className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                    Bateau (Optionnel)
                                    {selectedBoatId && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBoatId("")}
                                            className="flex items-center gap-1 text-[10px] text-red-500 hover:underline"
                                        >
                                            <X className="h-3 w-3" /> Détacher
                                        </button>
                                    )}
                                </Label>
                                <Popover
                                    open={boatComboOpen}
                                    onOpenChange={setBoatComboOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                'w-full justify-between bg-slate-50/30 font-medium',
                                                !selectedBoatId && 'text-muted-foreground',
                                            )}
                                        >
                                            <div className="flex items-center">
                                                <Ship className="mr-2 h-4 w-4 text-slate-400" />
                                                {selectedBoatId
                                                    ? boats.find(b => b.id.toString() === selectedBoatId)?.name
                                                    : 'Sans bateau (Client direct)'}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <SearchInput placeholder="Rechercher un bateau..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    Aucun bateau trouvé.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {boats.map((boat) => (
                                                        <CommandItem
                                                            key={boat.id}
                                                            className={commandItemClass}
                                                            onSelect={() => {
                                                                setSelectedBoatId(boat.id.toString());
                                                                setBoatComboOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    selectedBoatId === boat.id.toString()
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
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

                            {/* Summary View */}
                            <div className="grid grid-cols-2 gap-4 rounded-lg border border-dashed bg-slate-50 p-3">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Quantité
                                    </span>
                                    <p className="text-sm font-bold">
                                        {receipt.quantity} Kg
                                    </p>
                                </div>
                                <div className="border-l pl-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Total DH
                                    </span>
                                    <p className="text-sm font-bold text-blue-600">
                                        {receipt.total_amount} DH
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setOpen(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-slate-900 font-bold"
                                >
                                    {processing && (
                                        <Spinner className="mr-2 h-4 w-4" />
                                    )}
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