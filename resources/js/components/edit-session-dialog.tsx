import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    Loader2,
    Pencil,
    AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { cn } from '@/lib/utils';

import { update } from '@/routes/sessions'; 
import type { DailySession } from '@/types/daily-session';

interface Props {
    session: DailySession;
    existingDates?: string[]; // كنطلعو هاد الـ Prop باش نخدمو بـ disabledDays
}

export default function EditSessionDialog({ session, existingDates = [] }: Props) {
    const [open, setOpen] = useState(false);
    
    const [date, setDate] = useState<Date>(
        typeof session.session_date === 'string' 
            ? parseISO(session.session_date) 
            : session.session_date
    );

    const disabledDays = (day: Date): boolean => {
        const formattedDay = format(day, "yyyy-MM-dd");
        
        // التاريخ الحالي ديال الـ session اللي كنموديفيو
        const currentSessionDate = format(
            typeof session.session_date === 'string' 
                ? parseISO(session.session_date) 
                : session.session_date, 
            "yyyy-MM-dd"
        );

        // كنحيدو التاريخ ديال الـ session الحالية من الـ list ديال الـ disabled
        // باش يقدر الـ user يختار نفس النهار يلا بغا يصحح شي حاجة أخرى
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

            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-blue-600" />
                        Modifier la Journée
                    </DialogTitle>
                    <DialogDescription>
                        Modifiez la date de la session journalière. Les totaux seront conservés.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(session.id)}
                    onSuccess={() => {
                        toast.success('Session mise à jour ! ✨');
                        setOpen(false);
                    }}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-6 pt-4">
                            <input
                                type="hidden"
                                name="session_date"
                                value={date ? format(date, 'yyyy-MM-dd') : ""}
                            />

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
                                                errors.session_date ? "border-destructive bg-destructive/5" : "border-slate-200",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                            {date ? (
                                                format(date, 'dd-MM-yyyy', { locale: fr })
                                            ) : (
                                                <span>Choisir une date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => d && setDate(d)}
                                            disabled={disabledDays}
                                            initialFocus
                                            locale={fr}
                                            className="rounded-md border shadow-lg"
                                        />
                                    </PopoverContent>
                                </Popover>
                                
                                {errors.session_date && (
                                    <p className="text-sm font-bold text-destructive mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.session_date}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">État actuel</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 font-medium">Total Achat:</span>
                                    <span className="font-bold text-slate-900">{session.total_buy} DH</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 font-medium">Total Vente:</span>
                                    <span className="font-bold text-blue-600">{session.total_sell} DH</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setOpen(false)}
                                    disabled={processing}
                                    className="font-bold"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="min-w-[140px] font-bold uppercase tracking-wide shadow-md"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Mise à jour...
                                        </>
                                    ) : (
                                        'Mettre à jour'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}