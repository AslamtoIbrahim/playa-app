import { Form, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    AlertCircle,
    ArrowRight,
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Clock,
    Pencil,
    ShieldCheck,
    Building2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import { update } from '@/routes/invoices';
import type { Invoice, Billable } from '@/types/invoice';
import type { DailySession } from '@/types/daily-session';
import { Caution } from '@/types/caution';
import { OfficeRoom } from '@/types/office-room';
 

interface Props {
    invoice: Invoice;
    billables: Billable[];
    sessions: DailySession[];
    cautions: Caution[];
    officeRooms: OfficeRoom[];
    trigger?: React.ReactNode;
}

export default function EditInvoiceDialog({
    invoice,
    billables,
    sessions,
    cautions,
    officeRooms,
    trigger,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [comboOpen, setComboOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);
    const [cautionComboOpen, setCautionComboOpen] = useState<boolean>(false);
    const [officeComboOpen, setOfficeComboOpen] = useState<boolean>(false);

    const [selectedBillable, setSelectedBillable] = useState<Billable | null>(
        billables.find(
            (b) => b.id === invoice.billable_id && b.type === invoice.billable_type
        ) || null
    );

    const [selectedSession, setSelectedSession] = useState<DailySession | null>(
        sessions.find((s) => Number(s.id) === Number(invoice.session_id)) || null
    );

    const [selectedCaution, setSelectedCaution] = useState<Caution | null>(
        cautions.find((c) => Number(c.id) === Number(invoice.caution_id)) || null
    );

    const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
        invoice.office_room_id?.toString() || ""
    );

    const [date, setDate] = useState<Date>(parseISO(invoice.date));

    const filteredCautions = useMemo(() => {
        if (!selectedBillable) {
            return [];
        }

        return cautions.filter((c) => {
            const isSameId = Number(c.owner_id) === Number(selectedBillable.id);

            const isSameType = c.owner_type === selectedBillable.type ||
                c.owner_type.includes(selectedBillable.type!.replace(/\\/g, '\\\\'));

            if (isSameId && isSameType) {
                return true;
            }

            return false;
        });
    }, [selectedBillable, cautions]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase">
                        Modifier la Facture {invoice.invoice_number}
                    </DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations générales de la facture.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(invoice.id)}
                    onSuccess={() => {
                        toast.success('Facture mise à jour ! ✨');
                        setOpen(false);
                    }}
                    onError={(e) => {
                        console.log('Error update invoice:', e);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors, clearErrors }) => {
                        const sessionError = errors.date;

                        if (sessionError && sessionError.includes("session")) {
                            return (
                                <div className="space-y-6 py-4 text-center">
                                    <Alert variant="destructive" className="text-left bg-destructive/5">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="font-bold">Session manquante</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            {sessionError}
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex flex-col gap-2">
                                        <Button asChild variant="default" className="w-full font-bold uppercase">
                                            <Link href="/sessions">
                                                Aller créer une session <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                clearErrors('date');
                                                setDate(new Date());
                                            }}
                                        >
                                            Changer la date
                                        </Button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <>
                                <input
                                    type="hidden"
                                    name="billable_id"
                                    value={selectedBillable?.id || ''}
                                />
                                <input
                                    type="hidden"
                                    name="billable_type"
                                    value={selectedBillable?.type || ''}
                                />
                                <input
                                    type="hidden"
                                    name="caution_id"
                                    value={selectedCaution?.id || ''}
                                />
                                <input
                                    type="hidden"
                                    name="office_room_id"
                                    value={selectedOfficeId}
                                />
                                <input
                                    type="hidden"
                                    name="status"
                                    value={invoice.status}
                                />
                                <input
                                    type="hidden"
                                    name="date"
                                    value={date ? format(date, 'yyyy-MM-dd') : ''}
                                />
                                <input
                                    type="hidden"
                                    name="session_id"
                                    value={selectedSession?.id || ''}
                                />

                                {/* Session Selector */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        Session de travail
                                    </Label>
                                    <Popover
                                        open={sessionComboOpen}
                                        onOpenChange={setSessionComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between font-medium",
                                                    !selectedSession && "text-muted-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 opacity-50" />
                                                    {selectedSession
                                                        ? format(parseISO(selectedSession.session_date), 'dd MMMM yyyy')
                                                        : 'Sélectionner une session...'}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <SearchInput placeholder="Rechercher une session..." />
                                                <CommandList>
                                                    <CommandEmpty>Aucune session trouvée.</CommandEmpty>
                                                    <CommandGroup>
                                                        {sessions.map((session) => (
                                                            <CommandItem
                                                                className={commandItemClass}
                                                                key={session.id}
                                                                value={session.session_date}
                                                                onSelect={() => {
                                                                    setSelectedSession(session);
                                                                    setSessionComboOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        selectedSession?.id === session.id ? 'opacity-100' : 'opacity-0'
                                                                    )}
                                                                />
                                                                {format(parseISO(session.session_date), 'dd/MM/yyyy')}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Billable Selector */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        Compte / Client
                                    </Label>
                                    <Popover
                                        open={comboOpen}
                                        onOpenChange={setComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-medium"
                                            >
                                                {selectedBillable
                                                    ? selectedBillable.name
                                                    : 'Sélectionner un compte...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <SearchInput placeholder="Rechercher un compte..." />
                                                <CommandList>
                                                    <CommandEmpty>Aucun compte trouvé.</CommandEmpty>
                                                    <CommandGroup>
                                                        {billables.map((item) => {
                                                            const isSelected =
                                                                selectedBillable?.id === item.id &&
                                                                selectedBillable?.type === item.type;

                                                            return (
                                                                <CommandItem
                                                                    className={commandItemClass}
                                                                    key={`${item.type}-${item.id}`}
                                                                    value={item.name}
                                                                    onSelect={() => {
                                                                        setSelectedBillable(item);
                                                                        setSelectedCaution(null);
                                                                        setComboOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'mr-2 h-4 w-4',
                                                                            isSelected ? 'opacity-100' : 'opacity-0'
                                                                        )}
                                                                    />
                                                                    {item.name}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Caution Selector */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        Caution
                                    </Label>
                                    <Popover
                                        open={cautionComboOpen}
                                        onOpenChange={setCautionComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                disabled={!selectedBillable}
                                                className={cn(
                                                    "w-full justify-between font-medium",
                                                    !selectedCaution && "text-muted-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 opacity-50" />
                                                    {selectedCaution
                                                        ? selectedCaution.name
                                                        : 'Sélectionner une caution...'}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <SearchInput placeholder="Rechercher une caution..." />
                                                <CommandList>
                                                    <CommandEmpty>Aucune caution trouvée.</CommandEmpty>
                                                    <CommandGroup>
                                                        {filteredCautions.map((caution) => (
                                                            <CommandItem
                                                                className={commandItemClass}
                                                                key={caution.id}
                                                                value={caution.name}
                                                                onSelect={() => {
                                                                    setSelectedCaution(caution);
                                                                    setCautionComboOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        selectedCaution?.id === caution.id ? 'opacity-100' : 'opacity-0'
                                                                    )}
                                                                />
                                                                {caution.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Office / Bureau Selector */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Bureau / Ville</Label>
                                    <Popover open={officeComboOpen} onOpenChange={setOfficeComboOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between font-medium",
                                                    !selectedOfficeId && "text-muted-foreground",
                                                    errors.office_room_id && "border-destructive"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 opacity-50" />
                                                    {selectedOfficeId
                                                        ? officeRooms.find((r) => r.id.toString() === selectedOfficeId)?.name
                                                        : "Sélectionner un bureau..."}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <SearchInput placeholder="Rechercher un bureau..." />
                                                <CommandList>
                                                    <CommandEmpty>Aucun bureau trouvé.</CommandEmpty>
                                                    <CommandGroup>
                                                        {officeRooms.map((room) => (
                                                            <CommandItem
                                                                className={commandItemClass}
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
                                </div>

                                {/* Date Picker */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        Date de Facturation
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-medium"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
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
                                                onSelect={(d: Date | undefined) => {
                                                    if (d) {
                                                        setDate(d);
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Summary Section */}
                                <div className="grid grid-cols-2 gap-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Poids Total
                                        </span>
                                        <p className="text-sm font-bold text-slate-700">
                                            {invoice.weight || 0} KG
                                        </p>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200 pl-4">
                                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Montant Total
                                        </span>
                                        <p className="text-sm font-bold text-blue-600">
                                            {invoice.amount} DH
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
                                    <Button type="submit" disabled={processing} className="font-bold">
                                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                                        Enregistrer
                                    </Button>
                                </div>
                            </>
                        );
                    }}
                </Form>
            </DialogContent>
        </Dialog>
    );
}