import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    Loader2,
    Pencil,
    AlertCircle,
    ScrollText,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

import { update } from '@/routes/sessions';
import type { DailySession } from '@/types/daily-session';
import type { Zone } from '@/types/zone';

interface Props {
    session: DailySession;
    existingDates?: string[];
    zones: Zone[];
}

export default function EditSessionDialog({ session, existingDates = [], zones }: Props) {
    const [open, setOpen] = useState(false);

    const [date, setDate] = useState<Date>(
        typeof session.session_date === 'string'
            ? parseISO(session.session_date)
            : session.session_date
    );

    // كنعمروا الـ state بالـ IDs ديال الـ zones اللي كاينين ديجا في الـ session
    const [selectedZones, setSelectedZones] = useState<number[]>(
        session.zones?.map((z) => {
            return z.id;
        }) || []
    );

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

        const currentSessionDate = format(
            new Date(session.session_date),
            "yyyy-MM-dd"
        );

        return existingDates.some((d) => {
            const pureExistingDate = d.split(' ')[0].split('T')[0];

            return pureExistingDate === formattedDay && pureExistingDate !== currentSessionDate;
        });
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-blue-600" />
                        Modifier la Journée
                    </DialogTitle>
                    <DialogDescription>
                        Modifiez la date ou les zones. Attention: désactiver une zone active peut être restreint.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(session.id)}
                    onSuccess={() => {
                        toast.success('Session mise à jour ! ✨');
                        setOpen(false);
                    }}
                >
                    {({ processing, errors }) => {
                        return (
                            <div className="space-y-6 pt-4">
                                <input
                                    type="hidden"
                                    name="session_date"
                                    value={date ? format(date, 'yyyy-MM-dd') : ""}
                                />

                                {selectedZones.map((id) => {
                                    return (
                                        <input key={id} type="hidden" name="selected_zones[]" value={id} />
                                    );
                                })}

                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        Date de la session
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-medium py-6 border-2",
                                                    errors.session_date ? "border-destructive bg-destructive/5" : "border-slate-200"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                                {date ? format(date, 'dd-MM-yyyy', { locale: fr }) : <span>Choisir</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={(d) => {
                                                    return d && setDate(d);
                                                }}
                                                disabled={disabledDays}
                                                locale={fr}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid gap-3">
                                    <Label className="text-xs font-bold uppercase text-slate-500">
                                        Zones de travail
                                    </Label>
                                    <ScrollArea className="h-48 rounded-md border-2 border-slate-100 bg-slate-50/50 p-4">
                                        <div className="space-y-2">
                                            {zones.map((zone) => {
                                                const isSelected = selectedZones.includes(zone.id);

                                                return (
                                                    <div
                                                        key={zone.id}
                                                        className={`group flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${isSelected ? 'border-blue-200 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            id={`edit-zone-${zone.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() => {
                                                                return toggleZone(zone.id);
                                                            }}
                                                        />
                                                        <label htmlFor={`edit-zone-${zone.id}`} className={`flex-1 text-sm font-semibold cursor-pointer ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                                            {zone.name}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                    {errors.selected_zones && (
                                        <p className="text-xs font-bold text-destructive">{errors.selected_zones}</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => {
                                        return setOpen(false);
                                    }} disabled={processing}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing || selectedZones.length === 0} className="min-w-[140px] font-bold uppercase">
                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Mettre à jour'}
                                    </Button>
                                </div>
                            </div>
                        );
                    }}
                </Form>
            </DialogContent>
        </Dialog>
    );
}