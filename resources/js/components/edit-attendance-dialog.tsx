import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    Check,
    ChevronsUpDown,
    Clock,
    Pencil,
    UserCheck,
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
} from '@/components/ui/command';
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
import { Spinner } from '@/components/ui/spinner';
import { cn, commandItemClass } from '@/lib/utils';

// Wayfinder import
import { update } from '@/routes/attendances';

// Types
import { Attendance } from '@/types/attendance';
import { DailySession } from '@/types/daily-session';

interface Props {
    attendance: Attendance;
    sessions: DailySession[];
    trigger?: React.ReactNode;
}

export default function EditAttendanceDialog({
    attendance,
    sessions,
    trigger,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);

    const [selectedSession, setSelectedSession] = useState<DailySession | null>(
        sessions.find((s) => {
            return Number(s.id) === Number(attendance.daily_session_id);
        }) || null
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase flex items-center gap-2 text-slate-900">
                        <UserCheck className="h-5 w-5 text-blue-600" /> Modifier Pointage #{attendance.id}
                    </DialogTitle>

                    <DialogDescription>
                        Modifier la session associée à cette feuille de présence. La date sera mise à jour automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(attendance.id)}
                    onSuccess={() => {
                        toast.success('Pointage mis à jour !');

                        setOpen(false);
                    }}
                    onError={(e) => {
                        toast.error('Une erreur est survenue. Veuillez réessayer.');
                        console.error(e);
                    }}
                    className="space-y-5 pt-4"
                >
                    {({ processing, errors }) => {
                        return (
                            <>
                                <input 
                                    type="hidden" 
                                    name="daily_session_id" 
                                    value={selectedSession?.id || ''} 
                                />

                                {/* Session Field */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Session de travail
                                    </Label>

                                    <Popover open={sessionComboOpen} onOpenChange={setSessionComboOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between font-medium border-slate-200",
                                                    errors.daily_session_id && "border-destructive"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Clock className="h-4 w-4 opacity-50" />
                                                    {selectedSession ? (
                                                        format(parseISO(selectedSession.session_date), 'dd MMMM yyyy')
                                                    ) : (
                                                        'Choisir une session...'
                                                    )}
                                                </div>

                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Rechercher une session..." />

                                                <CommandList>
                                                    <CommandEmpty>Aucune session trouvée.</CommandEmpty>

                                                    <CommandGroup>
                                                        {sessions.map((session) => {
                                                            return (
                                                                <CommandItem
                                                                    key={session.id}
                                                                    className={commandItemClass}
                                                                    onSelect={() => {
                                                                        setSelectedSession(session);

                                                                        setSessionComboOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedSession?.id === session.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {format(parseISO(session.session_date), 'dd/MM/yyyy')}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    <InputError message={errors.daily_session_id} />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                        }}
                                    >
                                        Annuler
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="font-bold bg-slate-900 px-6 shadow-lg"
                                    >
                                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                                        Enregistrer les modifications
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