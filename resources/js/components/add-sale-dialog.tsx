import { Form, Link } from '@inertiajs/react';
import { format } from "date-fns";
import { ArrowRight, Calendar as CalendarIcon, Check, ChevronsUpDown, Plus } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Zdna hado
import { Spinner } from '@/components/ui/spinner';
import { cn, commandItemClass } from "@/lib/utils";
import { store } from '@/routes/sales';
import { Customer } from '@/types/customer';
import { DailySession } from '@/types/daily-session';
import { Calendar } from './ui/calendar';

interface Props {
    customers: Customer[];
    sessions: DailySession[];
}

export default function AddSaleDialog({ customers, sessions }: Props) {
    const [open, setOpen] = useState<boolean>(false);

    const [clientComboOpen, setClientComboOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(""); // Smiya s7i7a
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [type, setType] = useState<string>("normal"); // Default "normal"
    const [date, setDate] = useState<Date>(new Date());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle Vente
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="uppercase font-black text-slate-900">Nouvelle Vente</DialogTitle>
                    <DialogDescription>
                        Créez l'entête de la vente. Vous pourrez ajouter les produits après.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Vente initialisée avec succès ! ✨');
                        setOpen(false);
                        setSelectedCustomerId("");
                        setSelectedSessionId("");
                        setType("normal");
                        setDate(new Date());
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Hidden Inputs m-fixyin b smiyat li f le Backend */}
                            <input type="hidden" name="customer_id" value={selectedCustomerId} />
                            <input type="hidden" name="session_id" value={selectedSessionId} />
                            <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} />
                            <input type="hidden" name="type" value={type} />

                            {/* Section Type de Vente */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Type de Vente</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="w-full font-medium">
                                        <SelectValue placeholder="Type de vente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Vente Normale</SelectItem>
                                        <SelectItem value="usine">Vente Usine</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            {/* Section Date */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Date de Vente</Label>
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
                                <InputError message={errors.date} /> {/* Fix name here */}
                            </div>

                            {/* Section Session */}
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Journée d'affectation</Label>
                                    <Link href="/sessions" className="text-[12px] text-blue-600 hover:underline flex items-center gap-1">
                                        Sessions <ArrowRight className="h-2 w-2" />
                                    </Link>
                                </div>
                                <Popover open={sessionComboOpen} onOpenChange={setSessionComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", !selectedSessionId && "text-muted-foreground", errors.session_id && "border-destructive")}
                                        >
                                            {selectedSessionId
                                                ? format(new Date(sessions.find((s) => s.id.toString() === selectedSessionId)?.session_date || ""), "dd MMMM yyyy")
                                                : "Choisir la session..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher une session..." />
                                            <CommandList>
                                                <CommandEmpty>Aucune session trouvée.</CommandEmpty>
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
                                                            Session du {format(new Date(session.session_date), "dd/MM/yyyy")}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.session_id} />
                            </div>

                            {/* Section Client */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Client</Label>
                                <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between font-medium", !selectedCustomerId && "text-muted-foreground", errors.customer_id && "border-destructive")}
                                        >
                                            {selectedCustomerId
                                                ? customers.find((c) => c.id.toString() === selectedCustomerId)?.name
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
                                                                setClientComboOpen(false);
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
                                <InputError message={errors.customer_id} /> {/* Fix name here */}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="submit" disabled={processing} className="w-full font-bold uppercase tracking-wider bg-slate-900">
                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                                    Continuer vers les articles
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}