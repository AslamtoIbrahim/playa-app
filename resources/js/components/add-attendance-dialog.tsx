import { Form } from '@inertiajs/react';
import { format } from "date-fns";
import {
    Check,
    ChevronsUpDown,
    Plus,
    UserCheck,
    MapPin,
    Clock
} from 'lucide-react';
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

// Wayfinder import
import { store } from '@/routes/attendances';

// Types
import { SessionZone } from '@/types/session-zone'; // Assure-toi que le chemin est correct

interface Props {
    sessionZones: SessionZone[];
}

export default function AddAttendanceDialog({ sessionZones }: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [sessionZoneComboOpen, setSessionZoneComboOpen] = useState<boolean>(false);
    const [selectedSessionZoneId, setSelectedSessionZoneId] = useState<string>("");

    const getSessionZoneLabel = (id: string) => {
        const sz = sessionZones.find((s) => s.id.toString() === id);

        if (!sz) {
            return "";
        }

        const dateFormatted = format(new Date(sz.daily_session?.session_date || ""), "dd/MM/yyyy");

        return `${dateFormatted} - ${sz.zone?.name}`;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="font-bold bg-slate-900 hover:bg-slate-800">
                    <Plus className="mr-2 h-4 w-4" /> Nouveau Pointage
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="uppercase font-black flex items-center gap-2">
                        <UserCheck className="h-5 w-5" /> Créer une Feuille
                    </DialogTitle>

                    <DialogDescription>
                        Sélectionnez la journée et la zone correspondante pour ouvrir une nouvelle feuille de pointage.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Feuille de pointage créée !');
                        setOpen(false);
                        setSelectedSessionZoneId("");
                    }}
                    className="space-y-5 pt-4"
                >
                    {({ processing, errors }) => (
                        <>

                            <input type="hidden" name="session_zone_id" value={selectedSessionZoneId} />
                            {/* SessionZone Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">
                                    Journée & Zone
                                </Label>

                                <Popover open={sessionZoneComboOpen} onOpenChange={setSessionZoneComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between font-medium text-left h-auto py-2 border-slate-200 shadow-sm",
                                                !selectedSessionZoneId && "text-muted-foreground",
                                                errors.session_zone_id && "border-destructive"
                                            )}
                                        >
                                            <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                                {selectedSessionZoneId ? (
                                                    <span className="truncate capitalize flex items-center gap-2 text-slate-900">
                                                        <Clock className="h-4 w-4 text-slate-400" />
                                                        {getSessionZoneLabel(selectedSessionZoneId)}
                                                    </span>
                                                ) : (
                                                    "Sélectionner la journée et zone..."
                                                )}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="p-0 w-(--radix-popover-trigger-width)">
                                        <Command>
                                            <CommandInput placeholder="Rechercher une journée ou zone..." />

                                            <CommandList>
                                                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

                                                <CommandGroup>
                                                    {sessionZones.map((sz) => (
                                                        <CommandItem
                                                            className={cn(commandItemClass, "flex items-center justify-between gap-2")}
                                                            key={sz.id}
                                                            // Valeur de recherche : combine date et nom de zone
                                                            value={`${sz.daily_session?.session_date} ${sz.zone?.name}`}
                                                            onSelect={() => {
                                                                setSelectedSessionZoneId(sz.id.toString());
                                                                setSessionZoneComboOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center">
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedSessionZoneId === sz.id.toString() ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold">
                                                                        {sz.daily_session ? format(new Date(sz.daily_session.session_date), "dd/MM/yyyy") : 'N/A'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-700 capitalize font-medium flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3" /> {sz.zone?.name}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <span className={cn(
                                                                "ml-auto text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                                                                sz.daily_session?.status === 'open' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
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

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                                <Button
                                    type="submit"
                                    disabled={processing || !selectedSessionZoneId}
                                    className="w-full font-black uppercase tracking-widest shadow-lg shadow-slate-200"
                                >
                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                                    Confirmer l'ouverture
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}