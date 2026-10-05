import { Form, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ArrowRight,
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Clock,
    Layers,
    Plus,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatDateDisplay } from '@/lib/date';
import { cn, commandItemClass } from '@/lib/utils';
import { store } from '@/routes/sales';
import type { Customer } from '@/types/customer';
import type { DailySession } from '@/types/daily-session';
import { Calendar } from './ui/calendar';

interface Props {
    customers: Customer[];
    /** Daily sessions available for selection. Unused when `lockedSessionId` is set. */
    sessions?: DailySession[];
    /**
     * When provided, the sale is locked to this daily session: the session
     * picker is hidden and no other session can be targeted.
     */
    lockedSessionId?: number;
    /** Date imposed by the context (ISO or `yyyy-MM-dd`): no date picker. */
    lockedDate?: string;
    trigger?: ReactNode;
    title?: string;
    description?: string;
}

/**
 * Converts an ISO datetime (`2026-09-21T00:00:00.000000Z`) into `yyyy-MM-dd`
 * without going through the browser timezone.
 */
const toInputDate = (value: string): string => value.split('T')[0];

export default function AddSaleDialog({
    customers,
    sessions = [],
    lockedSessionId,
    lockedDate,
    trigger,
    title = 'Nouvelle Vente',
    description = "Créez l'entête de la vente. Vous pourrez ajouter les produits après.",
}: Props) {
    const [open, setOpen] = useState<boolean>(false);

    const [clientComboOpen, setClientComboOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedSessionId, setSelectedSessionId] = useState<string>(() =>
        lockedSessionId ? lockedSessionId.toString() : '',
    );
    const [type, setType] = useState<string>('normal'); // Default "normal"
    const [date, setDate] = useState<Date>(new Date());

    const isDateLocked = Boolean(lockedDate);
    const isSessionLocked = Boolean(lockedSessionId);
    const isLockedContext = isDateLocked || isSessionLocked;

    const dateValue = lockedDate
        ? toInputDate(lockedDate)
        : format(date, 'yyyy-MM-dd');

    // Keep the context values untouched: only the user-owned fields are reset.
    const resetContextState = (): void => {
        setSelectedCustomerId('');

        if (!isSessionLocked) {
            setSelectedSessionId('');
        }

        if (!isDateLocked) {
            setDate(new Date());
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button size="sm" className="font-bold">
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Vente
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-100">
                <DialogHeader>
                    <DialogTitle className="font-black text-slate-900 uppercase dark:text-slate-100">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Vente initialisée avec succès ! ✨');
                        setOpen(false);
                        resetContextState();
                        setType('normal');
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Hidden inputs feeding the backend with the final names. */}
                            <input
                                type="hidden"
                                name="customer_id"
                                value={selectedCustomerId}
                            />
                            <input
                                type="hidden"
                                name="session_id"
                                value={selectedSessionId}
                            />
                            <input
                                type="hidden"
                                name="date"
                                value={dateValue}
                            />
                            <input type="hidden" name="type" value={type} />

                            {isLockedContext && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40">
                                    {isDateLocked && (
                                        <Badge
                                            variant="outline"
                                            className="gap-1.5 border-neutral-200 bg-white px-2 py-0.5 dark:border-neutral-700 dark:bg-neutral-900"
                                        >
                                            <CalendarIcon className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                {formatDateDisplay(dateValue)}
                                            </span>
                                        </Badge>
                                    )}

                                    {isSessionLocked && (
                                        <Badge
                                            variant="outline"
                                            className="gap-1.5 border-neutral-200 bg-white px-2 py-0.5 dark:border-neutral-700 dark:bg-neutral-900"
                                        >
                                            <Clock className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                Journée du{' '}
                                                {formatDateDisplay(dateValue)}
                                            </span>
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Section Type de Vente */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Type de Vente
                                </Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="w-full font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 opacity-50" />
                                            <SelectValue placeholder="Type de vente" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200">
                                        <SelectItem
                                            value="normal"
                                            className="dark:focus:bg-neutral-700 dark:focus:text-slate-100"
                                        >
                                            Vente Normale
                                        </SelectItem>
                                        <SelectItem
                                            value="usine"
                                            className="dark:focus:bg-neutral-700 dark:focus:text-slate-100"
                                        >
                                            Vente Usine
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            {/* Section Date */}
                            {!isDateLocked && (
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                                        Date de Vente
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-700',
                                                    !date &&
                                                        'text-muted-foreground dark:text-slate-400',
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? (
                                                    format(date, 'dd/MM/yyyy')
                                                ) : (
                                                    <span>
                                                        Choisir une date
                                                    </span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={(d) => {
                                                    if (d) {
                                                        setDate(d);
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.date} />
                                </div>
                            )}

                            {/* Section Session */}
                            {!isSessionLocked && (
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                                            Journée d'affectation
                                        </Label>
                                        <Link
                                            href="/sessions"
                                            className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Sessions{' '}
                                            <ArrowRight className="h-2 w-2" />
                                        </Link>
                                    </div>
                                    <Popover
                                        open={sessionComboOpen}
                                        onOpenChange={setSessionComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    'w-full justify-between font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-700',
                                                    !selectedSessionId &&
                                                        'text-muted-foreground dark:text-slate-400',
                                                    errors.session_id &&
                                                        'border-destructive',
                                                )}
                                            >
                                                {selectedSessionId
                                                    ? format(
                                                          new Date(
                                                              sessions.find(
                                                                  (s) =>
                                                                      s.id.toString() ===
                                                                      selectedSessionId,
                                                              )?.session_date ||
                                                                  '',
                                                          ),
                                                          'dd MMMM yyyy',
                                                      )
                                                    : 'Choisir la session...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200">
                                            <Command className="dark:bg-neutral-800 dark:text-slate-200">
                                                <CommandInput
                                                    placeholder="Rechercher une session..."
                                                    className="dark:text-slate-200 dark:placeholder:text-slate-400"
                                                />
                                                <CommandList>
                                                    <CommandEmpty className="dark:text-slate-400">
                                                        Aucune session trouvée.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {sessions.map(
                                                            (session) => (
                                                                <CommandItem
                                                                    className={cn(
                                                                        commandItemClass,
                                                                        'dark:text-slate-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700',
                                                                    )}
                                                                    key={
                                                                        session.id
                                                                    }
                                                                    value={
                                                                        session.session_date
                                                                    }
                                                                    onSelect={() => {
                                                                        setSelectedSessionId(
                                                                            session.id.toString(),
                                                                        );
                                                                        setSessionComboOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'mr-2 h-4 w-4',
                                                                            selectedSessionId ===
                                                                                session.id.toString()
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                    Session du{' '}
                                                                    {format(
                                                                        new Date(
                                                                            session.session_date,
                                                                        ),
                                                                        'dd/MM/yyyy',
                                                                    )}
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.session_id} />
                                </div>
                            )}

                            {/* Section Client */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Client
                                </Label>
                                <Popover
                                    open={clientComboOpen}
                                    onOpenChange={setClientComboOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                'w-full justify-between font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-700',
                                                !selectedCustomerId &&
                                                    'text-muted-foreground dark:text-slate-400',
                                                errors.customer_id &&
                                                    'border-destructive',
                                            )}
                                        >
                                            {selectedCustomerId
                                                ? customers.find(
                                                      (c) =>
                                                          c.id.toString() ===
                                                          selectedCustomerId,
                                                  )?.name
                                                : 'Sélectionner un client...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200">
                                        <Command className="dark:bg-neutral-800 dark:text-slate-200">
                                            <CommandInput
                                                placeholder="Rechercher un client..."
                                                className="dark:text-slate-200 dark:placeholder:text-slate-400"
                                            />
                                            <CommandList>
                                                <CommandEmpty className="dark:text-slate-400">
                                                    Aucun client trouvé.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {customers.map(
                                                        (customer) => (
                                                            <CommandItem
                                                                className={cn(
                                                                    commandItemClass,
                                                                    'dark:text-slate-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700',
                                                                )}
                                                                key={
                                                                    customer.id
                                                                }
                                                                value={
                                                                    customer.name
                                                                }
                                                                onSelect={() => {
                                                                    setSelectedCustomerId(
                                                                        customer.id.toString(),
                                                                    );
                                                                    setClientComboOpen(
                                                                        false,
                                                                    );
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        selectedCustomerId ===
                                                                            customer.id.toString()
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                {customer.name}
                                                            </CommandItem>
                                                        ),
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.customer_id} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-slate-900 font-bold tracking-wider text-white uppercase hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                >
                                    {processing && (
                                        <Spinner className="mr-2 h-4 w-4" />
                                    )}
                                    Continuer vers les articles
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
