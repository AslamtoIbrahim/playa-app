import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
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
import { store } from '@/routes/sessions';
import { Form } from '@inertiajs/react';
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface Props {
    existingDates?: string[];
}

export default function AddSessionDialog({ existingDates = [] }: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [date, setDate] = useState<Date>(new Date());

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

            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="uppercase font-black text-slate-900 text-xl">
                        Nouvelle Journée
                    </DialogTitle>
                    <DialogDescription>
                        Choisissez la date pour ouvrir une nouvelle journée de travail.
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
                    {({ processing, errors }) => {
                        return (
                            <>
                                <input
                                    type="hidden"
                                    name="session_date"
                                    value={date ? format(date, "yyyy-MM-dd") : ""}
                                />

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

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
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