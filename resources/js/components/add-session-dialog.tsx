import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Props {
    existingDates?: string[];
    zones: Zone[];
}

export default function AddSessionDialog({ existingDates = [], zones }: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [date, setDate] = useState<Date>(new Date());
    const [selectedZones, setSelectedZones] = useState<number[]>([]);

    const toggleZone = (zoneId: number) => {
        if (selectedZones.includes(zoneId)) {
            setSelectedZones(selectedZones.filter((id) => {
                return id !== zoneId;
            }));
        } else {
            setSelectedZones([...selectedZones, zoneId]);
        }
    };

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

            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="uppercase font-black text-slate-900 text-xl">
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
                        setSelectedZones([]);
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

                                {selectedZones.map((id) => {
                                    return (
                                        <input
                                            key={id}
                                            type="hidden"
                                            name="selected_zones[]"
                                            value={id}
                                        />
                                    );
                                })}

                                {/* Date Picker Section */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">
                                        Date de la session
                                    </Label>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-medium py-6 border-2",
                                                    errors.session_date ? "border-destructive bg-destructive/5" : "border-slate-200",
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
                                                className="rounded-md border shadow-lg"
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
                                    <Label className="text-xs font-bold uppercase text-slate-500">
                                        Zones à inclure ({selectedZones.length})
                                    </Label>



                                    <ScrollArea className="h-64 rounded-md border-2 border-slate-100 bg-slate-50/50 p-4">
                                        <div className="space-y-2">
                                            {zones.map((zone) => {
                                                const isSelected = selectedZones.includes(zone.id);

                                                return (
                                                    <div
                                                        key={zone.id}
                                                        className={`
                                                                group flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200
                                                                ${isSelected
                                                                ? 'border-primary/40 bg-primary/5 shadow-sm'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                                }  `}
                                                    >
                                                        <Checkbox
                                                            id={`zone-${zone.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() => {
                                                                return toggleZone(zone.id);
                                                            }}
                                                            className="transition-transform duration-200 group-hover:scale-110"
                                                        />

                                                        <label
                                                            htmlFor={`zone-${zone.id}`}
                                                            className={`flex-1 text-sm font-semibold cursor-pointer select-none transition-colors
                                                             ${isSelected ? 'text-primary' : 'text-slate-700'}  `}
                                                        >
                                                            {zone.name}
                                                        </label>

                                                        {isSelected && (
                                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {zones.length === 0 && (
                                                <div className="text-center py-8 text-sm text-muted-foreground italic">
                                                    Aucune zone disponible.
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={processing || selectedZones.length === 0}
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