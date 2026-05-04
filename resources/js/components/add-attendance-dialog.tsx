import { Form } from '@inertiajs/react';
import { format } from "date-fns";
import {
    Check,
    ChevronsUpDown,
    Plus,
    UserCheck
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
import { DailySession } from '@/types/daily-session';

interface Props {
    sessions: DailySession[];
}

export default function AddAttendanceDialog({ sessions }: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");

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
                        Sélectionnez la session correspondante pour ouvrir une nouvelle feuille de pointage.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Feuille de pointage créée !');

                        setOpen(false);

                        setSelectedSessionId("");
                    }}
                    className="space-y-5 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="daily_session_id" value={selectedSessionId} />

                            {/* Session Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">
                                    Session de Travail
                                </Label>

                                <Popover open={sessionComboOpen} onOpenChange={setSessionComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between font-medium border-slate-200 shadow-sm",
                                                !selectedSessionId && "text-muted-foreground",
                                                errors.daily_session_id && "border-destructive"
                                            )}
                                        >
                                            {selectedSessionId
                                                ? format(new Date(sessions.find((s) => s.id.toString() === selectedSessionId)?.session_date || ""), "dd/MM/yyyy")
                                                : "Sélectionner une session..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="p-0 w-(--radix-popover-trigger-width)">
                                        <Command>
                                            <CommandInput placeholder="Rechercher une session..." />

                                            <CommandList>
                                                <CommandEmpty>Aucune session trouvée.</CommandEmpty>

                                                <CommandGroup>
                                                    {sessions.map((session) => (
                                                        <CommandItem
                                                            className={cn(commandItemClass, "w-full justify-between")}
                                                            key={session.id}
                                                            value={session.session_date}
                                                            onSelect={() => {
                                                                setSelectedSessionId(session.id.toString());

                                                                setSessionComboOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedSessionId === session.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />

                                                            {format(new Date(session.session_date), "dd/MM/yyyy")}

                                                            <span className="ml-auto text-[10px] border border-slate-300 bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase text-slate-500">
                                                                {session.status}
                                                            </span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                <InputError message={errors.daily_session_id} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full font-black uppercase tracking-widest shadow-lg shadow-emerald-100"
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