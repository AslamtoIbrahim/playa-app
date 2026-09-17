import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    Loader2,
    Pencil,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    zones: Zone[];
}

export default function EditSessionDialog({ session, zones }: Props) {
    const [open, setOpen] = useState(false);

    const [date, setDate] = useState<Date>(
        typeof session.session_date === 'string'
            ? parseISO(session.session_date)
            : session.session_date
    );

    // كنعمروا الـ state بالـ ID ديال الـ zone اللي كاين في الـ session
    const [selectedZoneId, setSelectedZoneId] = useState<string>(
        session.zones && session.zones.length > 0 ? session.zones[0].id.toString() : ""
    );


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-neutral-800 dark:hover:text-blue-400"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-112.5">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-black uppercase text-slate-900 dark:text-neutral-100">
                        <Pencil className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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

                                {selectedZoneId && (
                                    <input type="hidden" name="selected_zones[]" value={selectedZoneId} />
                                )}

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
                                                    errors.session_date ? "border-destructive bg-destructive/5" : "border-slate-200 dark:border-neutral-700"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                                                locale={fr}
                                                className="rounded-md border shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid gap-3">
                                    <Label className="text-xs font-bold uppercase text-slate-500 dark:text-neutral-400">
                                        Zone de travail
                                    </Label>
                                    <ScrollArea className="h-48 rounded-md border-2 border-slate-100 bg-slate-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
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
                                                        htmlFor={`edit-zone-${zone.id}`}
                                                        className={`group flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer select-none ${
                                                            isSelected
                                                                ? 'border-blue-200 bg-blue-50/50 shadow-sm dark:border-blue-900 dark:bg-blue-950/40'
                                                                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                                                        }`}
                                                    >
                                                        <RadioGroupItem
                                                            value={zoneIdStr}
                                                            id={`edit-zone-${zone.id}`}
                                                        />
                                                        <span
                                                            className={`flex-1 text-sm font-semibold ${
                                                                isSelected
                                                                    ? 'text-blue-700 dark:text-blue-300'
                                                                    : 'text-slate-700 dark:text-neutral-300'
                                                            }`}
                                                        >
                                                            {zone.name}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </RadioGroup>
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
                                    <Button type="submit" disabled={processing || !selectedZoneId} className="min-w-35 font-bold uppercase">
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