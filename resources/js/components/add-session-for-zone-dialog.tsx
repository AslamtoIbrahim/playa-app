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
import { store } from '@/routes/sessions';
import { Form } from '@inertiajs/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Zone {
    id: number;
    name: string;
}

interface Props {
    zone: Zone;
    existingSessionDates: string[];
}

export default function AddSessionForZoneDialog({
    zone,
    existingSessionDates = [],
}: Props) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date>(new Date());


    const disabledDays = (day: Date): boolean => {
        const formattedDay = format(day, "yyyy-MM-dd");

        return existingSessionDates.some((d) => {
            const pureExistingDate = d.split(' ')[0].split('T')[0];

            return pureExistingDate === formattedDay;
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="font-bold tracking-tight uppercase"
                >
                    <Plus className="mr-2 h-4 w-4" /> Ouvrir une journée
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-112.5">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900 uppercase dark:text-neutral-100">
                        Nouvelle journée
                    </DialogTitle>
                    <DialogDescription>
                        Ouvrir une journée pour la zone « {zone.name} ».
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Session ouverte avec succès ! 🚀');
                        setOpen(false);
                        setDate(new Date());
                    }}
                    className="space-y-6 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="session_date"
                                value={format(date, 'yyyy-MM-dd')}
                            />
                            <input
                                type="hidden"
                                name="selected_zones[]"
                                value={zone.id}
                            />

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Date de la session
                                </Label>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start border-2 py-6 text-left font-medium',
                                                errors.session_date
                                                    ? 'border-destructive bg-destructive/5'
                                                    : 'border-slate-200 dark:border-neutral-700',
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                            {format(date, 'dd-MM-yyyy', {
                                                locale: fr,
                                            })}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(selectedDate) => {
                                                if (selectedDate) {
                                                    setDate(selectedDate);
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
                                    <p className="mt-1 flex items-center gap-1 text-sm font-bold text-destructive">
                                        <span className="h-1 w-1 rounded-full bg-destructive" />
                                        {errors.session_date}
                                    </p>
                                )}
                                {errors.selected_zones && (
                                    <p className="mt-1 flex items-center gap-1 text-sm font-bold text-destructive">
                                        <span className="h-1 w-1 rounded-full bg-destructive" />
                                        {errors.selected_zones}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="text-md w-full py-7 font-bold tracking-widest uppercase shadow-md"
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
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
