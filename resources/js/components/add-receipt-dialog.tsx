import { Form } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Clock,
    MapPin,
    Plus,
    Receipt,
    Ship,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import SessionZoneBadge from '@/components/receipt-session-zone-badge';
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
import { Spinner } from '@/components/ui/spinner';
import { formatDateDisplay } from '@/lib/date';
import { cn, commandItemClass } from '@/lib/utils';

// Wayfinder import
import { store } from '@/routes/receipts';

import type { Boat } from '@/types/boat';
import type { Customer } from '@/types/customer';
import type { SessionZone } from '@/types/session-zone';
import { Calendar } from './ui/calendar';

interface Props {
    customers: Customer[];
    sessionZones: SessionZone[];
    boats: Boat[];
    /**
     * Quand fourni, la session/zone n'est plus choisissable. Plusieurs ids =
     * journée multi-zones (un sélecteur restreint est alors affiché).
     */
    lockedSessionZoneIds?: number[];
    /** Date imposée par le contexte (ISO ou `yyyy-MM-dd`). */
    lockedDate?: string;
    trigger?: ReactNode;
    title?: string;
    description?: string;
    /** Renvoie vers la journée après création au lieu de la fiche du bon. */
    redirectTo?: 'session';
}

/**
 * Convertit une date ISO (`2026-09-21T00:00:00.000000Z`) en `yyyy-MM-dd`
 * sans passer par le fuseau horaire du navigateur.
 */
const toInputDate = (value: string): string => value.split('T')[0];

export default function AddReceiptDialog({
    customers,
    sessionZones,
    boats,
    lockedSessionZoneIds,
    lockedDate,
    trigger,
    title = 'Nouveau Bon de Réception',
    description = "Créez l'entête du bon de réception. Vous pourrez ajouter les articles après validation.",
    redirectTo,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);

    const [customerComboOpen, setCustomerComboOpen] = useState<boolean>(false);
    const [sessionZoneComboOpen, setSessionZoneComboOpen] =
        useState<boolean>(false);
    const [boatComboOpen, setBoatComboOpen] = useState<boolean>(false);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedSessionZoneId, setSelectedSessionZoneId] = useState<string>(
        () =>
            lockedSessionZoneIds?.length
                ? lockedSessionZoneIds[0].toString()
                : '',
    );
    const [selectedBoatId, setSelectedBoatId] = useState<string>('');
    const [date, setDate] = useState<Date>(new Date());

    const isSessionZoneLocked = Boolean(lockedSessionZoneIds?.length);
    const isDateLocked = Boolean(lockedDate);
    const isLockedContext = isSessionZoneLocked || isDateLocked;

    const allowedSessionZones = isSessionZoneLocked
        ? sessionZones.filter((sessionZone) =>
              lockedSessionZoneIds?.includes(sessionZone.id),
          )
        : sessionZones;

    const selectedSessionZone =
        allowedSessionZones.find(
            (sessionZone) =>
                sessionZone.id.toString() === selectedSessionZoneId,
        ) ?? null;

    const dateValue = lockedDate
        ? toInputDate(lockedDate)
        : format(date, 'yyyy-MM-dd');

    const showSessionZoneSelect =
        !isSessionZoneLocked || allowedSessionZones.length > 1;

    // دالة مساعدة للحصول على النص المعروض في الـ Combobox
    const getSessionZoneLabel = (id: string) => {
        const sz = allowedSessionZones.find((s) => s.id.toString() === id);

        if (!sz) {
            return '';
        }

        const dateFormatted = format(
            new Date(sz.daily_session?.session_date || ''),
            'dd/MM/yyyy',
        );

        return `${dateFormatted} - ${sz.zone?.name}`;
    };

    const resetContextState = (): void => {
        if (!isSessionZoneLocked) {
            setSelectedSessionZoneId('');
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
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Bon de
                        Réception
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-black text-slate-900 uppercase dark:text-slate-50">
                        <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />{' '}
                        {title}
                    </DialogTitle>
                    <DialogDescription className="dark:text-slate-300">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Bon de réception créé avec succès !');

                        setOpen(false);
                        setSelectedCustomerId('');
                        setSelectedBoatId('');
                        resetContextState();
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="customer_id"
                                value={selectedCustomerId}
                            />
                            <input
                                type="hidden"
                                name="session_zone_id"
                                value={selectedSessionZoneId}
                            />
                            <input
                                type="hidden"
                                name="boat_id"
                                value={selectedBoatId}
                            />
                            <input
                                type="hidden"
                                name="date"
                                value={dateValue}
                            />

                            {redirectTo === 'session' && (
                                <input
                                    type="hidden"
                                    name="redirect_to"
                                    value="session"
                                />
                            )}

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

                                    {isSessionZoneLocked && (
                                        <SessionZoneBadge
                                            sessionZone={selectedSessionZone}
                                        />
                                    )}
                                </div>
                            )}

                            {!isDateLocked && (
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                                        Date de Réception
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50',
                                                    !date &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-300" />
                                                {date ? (
                                                    format(date, 'dd/MM/yyyy')
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
                                                onSelect={(
                                                    d: Date | undefined,
                                                ) => {
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

                            {/* SessionZone Field */}
                            {showSessionZoneSelect && (
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                                        {isSessionZoneLocked
                                            ? "Zone d'affectation"
                                            : 'Journée & Zone'}
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
                                                    'h-auto w-full justify-between py-2 text-left font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50',
                                                    !selectedSessionZoneId &&
                                                        'text-muted-foreground',
                                                    errors.session_zone_id &&
                                                        'border-destructive',
                                                )}
                                            >
                                                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                                    {selectedSessionZoneId ? (
                                                        <span className="flex items-center gap-3 truncate capitalize">
                                                            <Clock className="text-slate-400 dark:text-slate-300" />
                                                            {getSessionZoneLabel(
                                                                selectedSessionZoneId,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        'Sélectionner la journée et zone...'
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Rechercher une journée ou zone..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        Aucun résultat trouvé.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {allowedSessionZones.map(
                                                            (sz) => (
                                                                <CommandItem
                                                                    className={cn(
                                                                        commandItemClass,
                                                                        'flex items-center justify-between gap-2',
                                                                    )}
                                                                    key={sz.id}
                                                                    // البحث يشمل التاريخ واسم المنطقة
                                                                    value={`${sz.daily_session?.session_date} ${sz.zone?.name}`}
                                                                    onSelect={() => {
                                                                        setSelectedSessionZoneId(
                                                                            sz.id.toString(),
                                                                        );
                                                                        setSessionZoneComboOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'mr-2 h-4 w-4',
                                                                            selectedSessionZoneId ===
                                                                                sz.id.toString()
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">
                                                                            {sz.daily_session
                                                                                ? format(
                                                                                      new Date(
                                                                                          sz
                                                                                              .daily_session
                                                                                              .session_date,
                                                                                      ),
                                                                                      'dd/MM/yyyy',
                                                                                  )
                                                                                : 'N/A'}
                                                                        </span>
                                                                        <span className="flex items-center gap-1 text-xs font-medium text-slate-700 capitalize dark:text-slate-200">
                                                                            <MapPin className="h-3 w-3" />{' '}
                                                                            {
                                                                                sz
                                                                                    .zone
                                                                                    ?.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <span className="ml-auto rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase dark:bg-blue-500/15 dark:text-blue-300">
                                                                        {
                                                                            sz
                                                                                .daily_session
                                                                                ?.status
                                                                        }
                                                                    </span>
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <InputError
                                        message={errors.session_zone_id}
                                    />
                                </div>
                            )}

                            {/* Customer Field */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Client / Fournisseur
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
                                                'w-full justify-between font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50',
                                                !selectedCustomerId &&
                                                    'text-muted-foreground',
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
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un client..." />
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
                                                                value={
                                                                    customer.name
                                                                }
                                                                onSelect={() => {
                                                                    setSelectedCustomerId(
                                                                        customer.id.toString(),
                                                                    );
                                                                    setCustomerComboOpen(
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

                            {/* Boat Field (Optional) */}
                            <div className="grid gap-2">
                                <Label className="flex justify-between text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Bateau (Optionnel)
                                    {selectedBoatId && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedBoatId('')
                                            }
                                            className="flex items-center gap-1 text-[10px] text-red-500 hover:underline dark:text-red-400"
                                        >
                                            <X className="h-3 w-3" /> Effacer
                                        </button>
                                    )}
                                </Label>
                                <Popover
                                    open={boatComboOpen}
                                    onOpenChange={setBoatComboOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                'w-full justify-between bg-slate-50/50 font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50',
                                                !selectedBoatId &&
                                                    'text-muted-foreground',
                                            )}
                                        >
                                            <div className="flex items-center">
                                                <Ship className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-300" />
                                                {selectedBoatId
                                                    ? boats.find(
                                                          (b) =>
                                                              b.id.toString() ===
                                                              selectedBoatId,
                                                      )?.name
                                                    : 'Sans bateau (Client direct)'}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un bateau..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    Aucun bateau trouvé.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {boats.map((boat) => (
                                                        <CommandItem
                                                            className={
                                                                commandItemClass
                                                            }
                                                            key={boat.id}
                                                            value={boat.name}
                                                            onSelect={() => {
                                                                setSelectedBoatId(
                                                                    boat.id.toString(),
                                                                );
                                                                setBoatComboOpen(
                                                                    false,
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    selectedBoatId ===
                                                                        boat.id.toString()
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                            {boat.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.boat_id} />
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
                                    Enregistrer et continuer
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
