import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { store } from '@/routes/sessions';
import type { Zone } from '@/types/zone';
import { Form } from '@inertiajs/react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import MissingZonePopup from '@/components/missing-zone-popup';

interface Props {
    existingDates?: string[];
    zones: Zone[];
}

export default function AddSessionDialog({ existingDates = [], zones }: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [date, setDate] = useState<Date>(new Date());
    const [selectedZoneId, setSelectedZoneId] = useState<string>("");


    const disabledDays = (day: Date): boolean => {
        const formattedDay = format(day, "yyyy-MM-dd");

        return existingDates.some((d) => {
            const pureExistingDate = d.split(' ')[0].split('T')[0];

            return pureExistingDate === formattedDay;
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="font-bold uppercase tracking-tight">
                    <Plus className="mr-2 h-4 w-4" /> Ouvrir une journée
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-112.5">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase text-slate-900 dark:text-neutral-100">
                        Nouvelle Journée
                    </DialogTitle>
                    <DialogDescription>
                        Choisissez la date et les zones actives pour cette session.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Session ouverte avec succès ! 🚀');
                        setOpen(false);
                        setDate(new Date());
                        setSelectedZoneId("");
                    }}
                    className="space-y-6 pt-4"
                >
                    {({ processing, errors }) => {
                        return (
                            <>
                                {/* Hidden Inputs for Form Data */}
                                <input
                                    type="hidden"
                                    name="session_date"
                                    value={date ? format(date, "yyyy-MM-dd") : ""}
                                />

                                {selectedZoneId && (
                                    <input
                                        type="hidden"
                                        name="selected_zones[]"
                                        value={selectedZoneId}
                                    />
                                )}

                                {/* Date Picker Section */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500 dark:text-neutral-400">
                                        Date de la session
                                    </Label>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-medium py-6 border-2",
                                                    errors.session_date ? "border-destructive bg-destructive/5" : "border-slate-200 dark:border-neutral-700",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                                {date ? (
                                                    format(date, "dd-MM-yyyy", { locale: fr })
                                                ) : (
                                                    <span>Choisir une date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={(d) => {
                                                    if (d) {
                                                        setDate(d);
                                                    }
                                                }}
                                                disabled={disabledDays}
                                                initialFocus
                                                locale={fr}
                                                className="rounded-md border shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {errors.session_date && (
                                        <p className="text-sm font-bold text-destructive mt-1 flex items-center gap-1">
                                            <span className="h-1 w-1 rounded-full bg-destructive" />
                                            {errors.session_date}
                                        </p>
                                    )}
                                </div>

                                {/* Zones Selection Section */}
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase text-slate-500">
                                            Zone de la session
                                        </Label>
                                        <MissingZonePopup />
                                    </div>

                                    <ScrollArea className="h-64 rounded-md border-2 border-slate-100 bg-slate-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <RadioGroup
                                            value={selectedZoneId}
                                            onValueChange={setSelectedZoneId}
                                            className="space-y-2"
                                        >
                                            {zones.map((zone) => {
                                                const zoneIdStr = zone.id.toString();
                                                const isSelected = selectedZoneId === zoneIdStr;

                                                return (
                                                    <label
                                                        key={zone.id}
                                                        htmlFor={`zone-${zone.id}`}
                                                        className={`
                                                            group flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer select-none
                                                            ${isSelected
                                                                ? 'border-primary/40 bg-primary/5 shadow-sm dark:bg-primary/10'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                                                            }
                                                        `}
                                                    >
                                                        <RadioGroupItem
                                                            value={zoneIdStr}
                                                            id={`zone-${zone.id}`}
                                                            className="transition-transform duration-200 group-hover:scale-110"
                                                        />

                                                        <span
                                                            className={`flex-1 text-sm font-semibold transition-colors
                                                                ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-neutral-300'}
                                                            `}
                                                        >
                                                            {zone.name}
                                                        </span>

                                                        {isSelected && (
                                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                        )}
                                                    </label>
                                                );
                                            })}

                                            {zones.length === 0 && (
                                                <div className="text-center py-8 text-sm text-muted-foreground italic">
                                                    Aucune zone disponible.
                                                </div>
                                            )}
                                        </RadioGroup>
                                    </ScrollArea>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={processing || !selectedZoneId}
                                        className="w-full font-bold uppercase tracking-widest py-7 text-md shadow-md"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Ouverture en cours...
                                            </>
                                        ) : (
                                            'Ouvrir la session'
                                        )}
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