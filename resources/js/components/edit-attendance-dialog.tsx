import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Check, ChevronsUpDown, Clock, MapPin, Pencil, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput as SearchInput,
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
import { SessionZone } from '@/types/session-zone';

interface Props {
    attendance: Attendance;
    sessionZones: SessionZone[];
    trigger?: React.ReactNode;
}

export default function EditAttendanceDialog({
    attendance,
    sessionZones,
    trigger,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);
    const [sessionZoneComboOpen, setSessionZoneComboOpen] = useState<boolean>(false);

    const [selectedSessionZoneId, setSelectedSessionZoneId] = useState<string>(
        attendance.session_zone_id?.toString() || ""
    );

    const getSessionZoneLabel = (id: string) => {
        const sz = sessionZones.find((s) => s.id.toString() === id);

        if (!sz) {
            return "";
        }

        const dateStr = sz.daily_session?.session_date
            ? format(parseISO(sz.daily_session.session_date), 'dd/MM/yyyy')
            : 'N/A';

        return `${dateStr} - ${sz.zone?.name}`;
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-black text-slate-900 uppercase">
                        <UserCheck className="h-5 w-5 text-blue-600" /> Modifier
                        Pointage #{attendance.id}
                    </DialogTitle>

                    <DialogDescription>
                        Modifier la session associée à cette feuille de
                        présence. La date sera mise à jour automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(attendance.id)}
                    onSuccess={() => {
                        toast.success('Pointage mis à jour !');

                        setOpen(false);
                    }}
                    onError={(e) => {
                        toast.error(
                            'Une erreur est survenue. Veuillez réessayer.',
                        );
                        console.error(e);
                    }}
                    className="space-y-5 pt-4"
                >
                    {({ processing, errors }) => {

                        return (
                            <>
                                <input
                                    type="hidden"
                                    name="session_zone_id"
                                    value={selectedSessionZoneId}
                                />

                                {/* Session Field */}
                                {/* <div className="grid gap-2">
                                    <Label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Session de travail
                                    </Label>

                                    <Popover
                                        open={sessionComboOpen}
                                        onOpenChange={setSessionComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    'w-full justify-between border-slate-200 font-medium',
                                                    errors.daily_session_id &&
                                                    'border-destructive',
                                                )}
                                            >
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Clock className="h-4 w-4 opacity-50" />
                                                    {selectedSession
                                                        ? format(
                                                            parseISO(
                                                                selectedSession.session_date,
                                                            ),
                                                            'dd MMMM yyyy',
                                                        )
                                                        : 'Choisir une session...'}
                                                </div>

                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Rechercher une session..." />

                                                <CommandList>
                                                    <CommandEmpty>
                                                        Aucune session trouvée.
                                                    </CommandEmpty>

                                                    <CommandGroup>
                                                        {sessions.map(
                                                            (session) => {
                                                                return (
                                                                    <CommandItem
                                                                        key={
                                                                            session.id
                                                                        }
                                                                        className={
                                                                            commandItemClass
                                                                        }
                                                                        onSelect={() => {
                                                                            setSelectedSession(
                                                                                session,
                                                                            );

                                                                            setSessionComboOpen(
                                                                                false,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                selectedSession?.id ===
                                                                                    session.id
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0',
                                                                            )}
                                                                        />
                                                                        {format(
                                                                            parseISO(
                                                                                session.session_date,
                                                                            ),
                                                                            'dd/MM/yyyy',
                                                                        )}
                                                                    </CommandItem>
                                                                );
                                                            },
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    <InputError
                                        message={errors.daily_session_id}
                                    />
                                </div> */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        Journée & Zone
                                    </Label>
                                    <Popover
                                        open={sessionZoneComboOpen}
                                        onOpenChange={setSessionZoneComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between font-medium text-left h-auto py-2",
                                                    !selectedSessionZoneId && "text-muted-foreground",
                                                    errors.session_zone_id && "border-destructive"
                                                )}
                                            >
                                                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                                    {selectedSessionZoneId ? (
                                                        <span className="truncate capitalize">{getSessionZoneLabel(selectedSessionZoneId)}</span>
                                                    ) : (
                                                        "Choisir une session & zone..."
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <SearchInput placeholder="Rechercher une journée ou zone..." />
                                                <CommandList>
                                                    <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                                                    <CommandGroup>
                                                        {sessionZones.map((sz) => (
                                                            <CommandItem
                                                                key={sz.id}
                                                                className={commandItemClass}
                                                                value={`${sz.daily_session?.session_date} ${sz.zone?.name}`}
                                                                onSelect={() => {
                                                                    setSelectedSessionZoneId(sz.id.toString());
                                                                    setSessionZoneComboOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        selectedSessionZoneId === sz.id.toString()
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold">
                                                                        {sz.daily_session ? format(parseISO(sz.daily_session.session_date), "dd/MM/yyyy") : 'N/A'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-700 capitalize font-medium flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3" /> {sz.zone?.name}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.session_zone_id} />
                                </div>

                                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
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
                                        className="bg-slate-900 px-6 font-bold shadow-lg"
                                    >
                                        {processing && (
                                            <Spinner className="mr-2 h-4 w-4" />
                                        )}
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
