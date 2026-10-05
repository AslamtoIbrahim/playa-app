import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Clock,
    Layers,
    Pencil,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput as SearchInput,
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

import { update } from '@/routes/sales';
import type { Customer } from '@/types/customer';
import type { DailySession } from '@/types/daily-session';
import type { Sale } from '@/types/sale';

interface Props {
    sale: Sale;
    /** Daily sessions available for selection. Unused when `lockedSessionId` is set. */
    sessions?: DailySession[];
    customers: Customer[];
    /**
     * When provided, the sale stays attached to this daily session: the session
     * picker is hidden and no other session can be targeted.
     */
    lockedSessionId?: number;
    /** Date imposed by the context (ISO or `yyyy-MM-dd`): no date picker. */
    lockedDate?: string;
    trigger?: React.ReactNode;
}

/**
 * Converts an ISO datetime (`2026-09-21T00:00:00.000000Z`) into `yyyy-MM-dd`
 * without going through the browser timezone.
 */
const toInputDate = (value: string): string => value.split('T')[0];

export default function EditSaleDialog({
    sale,
    sessions = [],
    customers,
    lockedSessionId,
    lockedDate,
    trigger,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [sessionComboOpen, setSessionComboOpen] = useState<boolean>(false);
    const [customerComboOpen, setCustomerComboOpen] = useState<boolean>(false);

    const [selectedSession, setSelectedSession] = useState<DailySession | null>(
        sessions.find((s) => Number(s.id) === Number(sale.session_id)) || null,
    );

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        customers.find((c) => Number(c.id) === Number(sale.customer_id)) ||
            null,
    );

    // Track the selected sale type.
    const [type, setType] = useState<string>(sale.type || 'normal');
    const [date, setDate] = useState<Date>(parseISO(sale.date));

    const isDateLocked = Boolean(lockedDate);
    const isSessionLocked = Boolean(lockedSessionId);
    const isLockedContext = isDateLocked || isSessionLocked;

    const sessionIdValue = lockedSessionId
        ? lockedSessionId.toString()
        : selectedSession?.id || '';

    const dateValue = lockedDate
        ? toInputDate(lockedDate)
        : format(date, 'yyyy-MM-dd');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase">
                        Modifier la Vente #{sale.id}
                    </DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations de la vente.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(sale.id)}
                    onSuccess={() => {
                        toast.success('Vente mise à jour ! ✨');
                        setOpen(false);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => {
                        return (
                            <>
                                {/* Hidden inputs feeding the backend with the final names. */}
                                <input
                                    type="hidden"
                                    name="date"
                                    value={dateValue}
                                />
                                <input
                                    type="hidden"
                                    name="session_id"
                                    value={sessionIdValue}
                                />
                                <input
                                    type="hidden"
                                    name="customer_id"
                                    value={selectedCustomer?.id || ''}
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
                                                    {formatDateDisplay(
                                                        dateValue,
                                                    )}
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
                                                    {formatDateDisplay(
                                                        dateValue,
                                                    )}
                                                </span>
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Section Type de Vente */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        Type de Vente
                                    </Label>
                                    <Select
                                        value={type}
                                        onValueChange={setType}
                                    >
                                        <SelectTrigger className="w-full font-medium">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 opacity-50" />
                                                <SelectValue placeholder="Type de vente" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">
                                                Vente Normale
                                            </SelectItem>
                                            <SelectItem value="usine">
                                                Vente Usine
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                {/* Section Customer */}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        Client
                                    </Label>
                                    <Popover
                                        open={customerComboOpen}
                                        onOpenChange={setCustomerComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    'w-full justify-between font-medium',
                                                    errors.customer_id &&
                                                        'border-destructive',
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 opacity-50" />
                                                    {selectedCustomer
                                                        ? selectedCustomer.name
                                                        : 'Sélectionner un client...'}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <SearchInput placeholder="Rechercher un client..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        Aucun client trouvé.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {customers.map(
                                                            (customer) => (
                                                                <CommandItem
                                                                    className={
                                                                        commandItemClass
                                                                    }
                                                                    key={
                                                                        customer.id
                                                                    }
                                                                    onSelect={() => {
                                                                        setSelectedCustomer(
                                                                            customer,
                                                                        );
                                                                        setCustomerComboOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'mr-2 h-4 w-4',
                                                                            selectedCustomer?.id ===
                                                                                customer.id
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                    {
                                                                        customer.name
                                                                    }
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

                                {/* Session Field */}
                                {!isSessionLocked && (
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">
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
                                                        'w-full justify-between font-medium',
                                                        errors.session_id &&
                                                            'border-destructive',
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 opacity-50" />
                                                        {selectedSession
                                                            ? format(
                                                                  parseISO(
                                                                      selectedSession.session_date,
                                                                  ),
                                                                  'dd MMMM yyyy',
                                                              )
                                                            : 'Sélectionner une session...'}
                                                    </div>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <SearchInput placeholder="Rechercher une session..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            Aucune session
                                                            trouvée.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {sessions.map(
                                                                (session) => (
                                                                    <CommandItem
                                                                        className={
                                                                            commandItemClass
                                                                        }
                                                                        key={
                                                                            session.id
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
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <InputError
                                            message={errors.session_id}
                                        />
                                    </div>
                                )}

                                {/* Date Picker */}
                                {!isDateLocked && (
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">
                                            Date de la Vente
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full justify-start text-left font-medium',
                                                        errors.date &&
                                                            'border-destructive',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date ? (
                                                        format(
                                                            date,
                                                            'dd/MM/yyyy',
                                                        )
                                                    ) : (
                                                        <span>
                                                            Choisir une date
                                                        </span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={(d) =>
                                                        d && setDate(d)
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <InputError message={errors.date} />
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setOpen(false)}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="font-bold"
                                    >
                                        {processing && (
                                            <Spinner className="mr-2 h-4 w-4" />
                                        )}
                                        Mettre à jour
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
