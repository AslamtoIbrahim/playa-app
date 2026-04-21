import { Form, Link } from '@inertiajs/react';
import { format } from "date-fns";
import { AlertCircle, Calendar as CalendarIcon, Check, ChevronsUpDown, Plus, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Billable } from '@/types/invoice';
import { Calendar } from './ui/calendar';

interface Props {
    billables: Billable[];
    officeRooms: { id: number; name: string; city: string }[];
}

export default function AddInvoiceDialog({ billables, officeRooms }: Props) {
    const [open, setOpen] = useState<boolean>(false);

    const [billableComboOpen, setBillableComboOpen] = useState<boolean>(false);
    const [officeComboOpen, setOfficeComboOpen] = useState<boolean>(false);

    const [selectedBillable, setSelectedBillable] = useState<Billable | null>(null);
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
    const [invoiceType, setInvoiceType] = useState<string>("purchase");
    const [date, setDate] = useState<Date>(new Date());

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
                        setInvoiceType("purchase");
                        setDate(new Date());
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
                                {/* Inputs cachés pour le formulaire Polymorphic */}
                                <input type="hidden" name="billable_id" value={selectedBillable?.id || ""} />
                                <input type="hidden" name="billable_type" value={selectedBillable?.type || ""} />
                                <input type="hidden" name="office_room_id" value={selectedOfficeId} />
                                <input type="hidden" name="type" value={invoiceType} />
                                <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />

                                {/* Type de Facture */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Type de flux</Label>
                                    <Select value={invoiceType} onValueChange={setInvoiceType}>
                                        <SelectTrigger className="font-medium">
                                            <SelectValue placeholder="Sélectionner le type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="purchase">Achat (Purchase)</SelectItem>
                                            <SelectItem value="sale">Vente (Sale)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                {/* Sélection du Billable (Customer/Company) */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Compte / Client</Label>
                                    <Popover open={billableComboOpen} onOpenChange={setBillableComboOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn("w-full justify-between font-medium", !selectedBillable && "text-muted-foreground")}
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

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="submit" disabled={processing} className="w-full font-bold uppercase tracking-wider">
                                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                                        Enregistrer la Facture
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