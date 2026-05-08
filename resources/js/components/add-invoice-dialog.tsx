import { Form, Link } from '@inertiajs/react';
import { format } from "date-fns";
import { fr } from "date-fns/locale"; // Import pour le formatage en français si besoin
import { ArrowRight, Calendar as CalendarIcon, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from '@/components/ui/spinner';
import { cn, commandItemClass } from "@/lib/utils";
import { store } from '@/routes/invoices';
import { Caution } from '@/types/caution';
import { Billable } from '@/types/invoice';
import { OfficeRoom } from '@/types/office-room';
import { SessionZone } from '@/types/session-zone';
import { Calendar } from './ui/calendar';

interface Props {
    billables: Billable[];
    officeRooms: OfficeRoom[];
    sessionZones: SessionZone[];
    cautions: Caution[];
}

export default function AddInvoiceDialog({ billables, officeRooms, sessionZones, cautions }: Props) {
    const [open, setOpen] = useState<boolean>(false);

    const [billableComboOpen, setBillableComboOpen] = useState<boolean>(false);
    const [officeComboOpen, setOfficeComboOpen] = useState<boolean>(false);
    const [sessionZoneComboOpen, setSessionZoneComboOpen] = useState<boolean>(false);
    const [cautionComboOpen, setCautionComboOpen] = useState<boolean>(false);

    const [selectedBillable, setSelectedBillable] = useState<Billable | null>(null);
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
    const [selectedSessionZoneId, setSelectedSessionZoneId] = useState<string>("");
    const [selectedCautionId, setSelectedCautionId] = useState<string>("");
    const [invoiceType, setInvoiceType] = useState<string>("purchase");
    const [date, setDate] = useState<Date>(new Date());

    const filteredCautions = useMemo(() => {
        if (!selectedBillable) {
            return [];
        }

        return cautions.filter((c) => {
            const isSameId = Number(c.owner_id) === Number(selectedBillable.id);
            const isSameType = c.owner_type === selectedBillable.type || 
                               c.owner_type.includes(selectedBillable.type!.replace(/\\/g, '\\\\'));

            return isSameId && isSameType;
        });
    }, [selectedBillable, cautions]);

    // Helper pour trouver la session zone sélectionnée
    const currentSessionZone = useMemo(() => 
        sessionZones.find((sz) => sz.id.toString() === selectedSessionZoneId),
    [selectedSessionZoneId, sessionZones]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une Facture
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
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
                        setSelectedBillable(null);
                        setSelectedOfficeId("");
                        setSelectedSessionZoneId("");
                        setSelectedCautionId("");
                        setInvoiceType("purchase");
                        setDate(new Date());
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="billable_id" value={selectedBillable?.id || ""} />
                            <input type="hidden" name="billable_type" value={selectedBillable?.type || ""} />
                            <input type="hidden" name="office_room_id" value={selectedOfficeId} />
                            <input type="hidden" name="session_zone_id" value={selectedSessionZoneId} />
                            <input type="hidden" name="caution_id" value={selectedCautionId} />
                            <input type="hidden" name="type" value={invoiceType} />
                            <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Type de flux</Label>
                                    <Select value={invoiceType} onValueChange={setInvoiceType}>
                                        <SelectTrigger className="font-medium">
                                            <SelectValue placeholder="Sélectionner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="purchase">Achat</SelectItem>
                                            <SelectItem value="sale">Vente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Date Facture</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn("w-full justify-start text-left font-medium", !date && "text-muted-foreground")}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "dd/MM/yyyy") : <span>Choisir</span>}
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
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Session & Zone d'affectation</Label>
                                    <Link href="/sessions" className="text-[12px] text-blue-600 hover:underline flex items-center gap-1">
                                        Gérer les sessions <ArrowRight className="h-2 w-2" />
                                    </Link>
                                </div>
                                <Popover open={sessionZoneComboOpen} onOpenChange={setSessionZoneComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between font-medium", 
                                                !selectedSessionZoneId && "text-muted-foreground", 
                                                errors.session_zone_id && "border-destructive"
                                            )}
                                        >
                                            {currentSessionZone
                                                ? `${format(new Date(currentSessionZone.daily_session?.session_date || ""), "dd/MM/yyyy")} - ${currentSessionZone.zone?.name}`
                                                : "Choisir la session/zone..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher une zone ou date..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {sessionZones.map((sz) => (
                                                        <CommandItem
                                                            className={commandItemClass}
                                                            key={sz.id}
                                                            value={`${sz.daily_session?.session_date} ${sz.zone?.name}`}
                                                            onSelect={() => {
                                                                setSelectedSessionZoneId(sz.id.toString());
                                                                setSessionZoneComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedSessionZoneId === sz.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col">
                                                                <span>{sz.zone?.name}</span>
                                                                <span className="text-[10px] text-slate-500">
                                                                    Session du {sz.daily_session?.session_date ? format(new Date(sz.daily_session.session_date), "dd/MM/yyyy") : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <span className={cn(
                                                                "ml-auto text-[10px] uppercase px-1.5 py-0.5 rounded-sm",
                                                                sz.daily_session?.status === 'open' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                                                            )}>
                                                                {sz.daily_session?.status}
                                                            </span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.session_zone_id} />
                            </div>

                            {/* Reste du formulaire (Client, Caution, Bureau) inchangé */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Compte / Client</Label>
                                <Popover open={billableComboOpen} onOpenChange={setBillableComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", !selectedBillable && "text-muted-foreground", errors.billable_id && "border-destructive")}
                                        >
                                            {selectedBillable ? selectedBillable.name : "Sélectionner un compte..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {billables.map((item) => (
                                                        <CommandItem
                                                            className={commandItemClass}
                                                            key={`${item.type}-${item.id}`}
                                                            value={item.name}
                                                            onSelect={() => {
                                                                setSelectedBillable(item);
                                                                setSelectedCautionId("");
                                                                setBillableComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedBillable?.id === item.id && selectedBillable?.type === item.type ? "opacity-100" : "opacity-0")} />
                                                            {item.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.billable_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Caution associée</Label>
                                <Popover open={cautionComboOpen} onOpenChange={setCautionComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            disabled={!selectedBillable}
                                            className={cn(
                                                "w-full justify-between font-medium",
                                                !selectedCautionId && "text-muted-foreground",
                                                errors.caution_id && "border-destructive"
                                            )}
                                        >
                                            {selectedCautionId
                                                ? filteredCautions.find((c) => c.id.toString() === selectedCautionId)?.name
                                                : selectedBillable ? "Sélectionner une caution..." : "Sélectionnez d'abord un compte"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher une caution..." />
                                            <CommandList>
                                                <CommandEmpty>Aucune caution trouvée.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredCautions.map((caution) => (
                                                        <CommandItem
                                                            className={commandItemClass}
                                                            key={caution.id}
                                                            value={caution.name}
                                                            onSelect={() => {
                                                                setSelectedCautionId(caution.id.toString());
                                                                setCautionComboOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedCautionId === caution.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {caution.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.caution_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Bureau / Ville</Label>
                                <Popover open={officeComboOpen} onOpenChange={setOfficeComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", !selectedOfficeId && "text-muted-foreground", errors.office_room_id && "border-destructive")}
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
                                <InputError message={errors.office_room_id} />
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