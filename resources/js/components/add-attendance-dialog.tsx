import { Form } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Clock,
    MapPin,
    Plus,
    UserCheck,
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
import { store } from '@/routes/attendances';

// Types
import type { SessionZone } from '@/types/session-zone';

interface Props {
    /** Journées / zones disponibles. Inutile quand `lockedSessionZoneIds` est fourni. */
    sessionZones?: SessionZone[];
    /**
     * Journée courante : quand fourni, la session/zone n'est plus choisissable.
     * Plusieurs ids = journée multi-zones (un sélecteur restreint est alors affiché).
     */
    lockedSessionZoneIds?: number[];
    /** Date imposée par le contexte (ISO ou `yyyy-MM-dd`). */
    lockedDate?: string;
    trigger?: ReactNode;
    title?: string;
    description?: string;
    /** Ouvre directement la fiche du pointage après création. */
    redirectTo?: 'show';
}

export default function AddAttendanceDialog({
    sessionZones,
    lockedSessionZoneIds,
    lockedDate,
    trigger,
    title = 'Créer une Feuille',
    description = 'Sélectionnez la journée et la zone correspondante pour ouvrir une nouvelle feuille de pointage.',
    redirectTo,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [sessionZoneComboOpen, setSessionZoneComboOpen] =
        useState<boolean>(false);

    const isSessionZoneLocked = Boolean(lockedSessionZoneIds?.length);
    const isDateLocked = Boolean(lockedDate);
    const isLockedContext = isSessionZoneLocked || isDateLocked;

    const allowedSessionZones = isSessionZoneLocked
        ? (sessionZones ?? []).filter((sessionZone) =>
              lockedSessionZoneIds?.includes(sessionZone.id),
          )
        : (sessionZones ?? []);

    const [selectedSessionZoneId, setSelectedSessionZoneId] = useState<string>(
        () =>
            lockedSessionZoneIds?.length
                ? lockedSessionZoneIds[0].toString()
                : '',
    );

    const selectedSessionZone =
        allowedSessionZones.find(
            (sessionZone) =>
                sessionZone.id.toString() === selectedSessionZoneId,
        ) ?? null;

    const showSessionZoneSelect =
        !isSessionZoneLocked || allowedSessionZones.length > 1;

    const getSessionZoneLabel = (id: string): string => {
        const sz = allowedSessionZones.find((s) => s.id.toString() === id);

        if (!sz) {
            return '';
        }

        const sessionDate = sz.daily_session?.session_date;

        if (!sessionDate) {
            return sz.zone?.name ?? 'Inconnue';
        }

        return `${formatDateDisplay(sessionDate)} - ${sz.zone?.name ?? 'Inconnue'}`;
    };

    const resetContextState = (): void => {
        if (!isSessionZoneLocked) {
            setSelectedSessionZoneId('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button
                        size="sm"
                        className="bg-neutral-900 font-bold text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Pointage
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-black uppercase">
                        <UserCheck className="h-5 w-5" /> {title}
                    </DialogTitle>

                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Feuille de pointage créée !');
                        setOpen(false);
                        resetContextState();
                    }}
                    className="space-y-5 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="session_zone_id"
                                value={selectedSessionZoneId}
                            />

                            {redirectTo === 'show' && (
                                <input
                                    type="hidden"
                                    name="redirect_to"
                                    value="show"
                                />
                            )}

                            {isLockedContext && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {isDateLocked &&
                                            !isSessionZoneLocked && (
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1.5 border-neutral-200 bg-white px-2 py-0.5 dark:border-neutral-700 dark:bg-neutral-900"
                                                >
                                                    <CalendarIcon className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                                                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                        {formatDateDisplay(
                                                            lockedDate,
                                                        )}
                                                    </span>
                                                </Badge>
                                            )}

                                        {isSessionZoneLocked && (
                                            <SessionZoneBadge
                                                sessionZone={
                                                    selectedSessionZone
                                                }
                                            />
                                        )}
                                    </div>

                                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Journée déjà définie
                                    </span>
                                </div>
                            )}

                            {/* SessionZone Field */}
                            {showSessionZoneSelect && (
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase dark:text-neutral-400">
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
                                                    'h-auto w-full justify-between border-neutral-200 bg-white py-2 text-left font-medium text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100',
                                                    !selectedSessionZoneId &&
                                                        'text-muted-foreground',
                                                    errors.session_zone_id &&
                                                        'border-destructive',
                                                )}
                                            >
                                                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                                                    {selectedSessionZoneId ? (
                                                        <span className="flex items-center gap-2 truncate text-neutral-900 capitalize dark:text-neutral-100">
                                                            <Clock className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
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

                                        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
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
                                                                        'flex items-center justify-between gap-2 dark:text-neutral-100',
                                                                    )}
                                                                    key={sz.id}
                                                                    // Valeur de recherche : combine date et nom de zone
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
                                                                    <div className="flex items-center">
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
                                                                            <span className="font-bold dark:text-neutral-100">
                                                                                {formatDateDisplay(
                                                                                    sz
                                                                                        .daily_session
                                                                                        ?.session_date,
                                                                                ) ||
                                                                                    'N/A'}
                                                                            </span>
                                                                            <span className="flex items-center gap-1 text-xs font-medium text-neutral-700 capitalize dark:text-neutral-300">
                                                                                <MapPin className="h-3 w-3" />{' '}
                                                                                {
                                                                                    sz
                                                                                        .zone
                                                                                        ?.name
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <span
                                                                        className={cn(
                                                                            'ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                                                                            sz
                                                                                .daily_session
                                                                                ?.status ===
                                                                                'open'
                                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
                                                                        )}
                                                                    >
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
                                </div>
                            )}

                            <InputError message={errors.session_zone_id} />

                            <div className="mt-2 flex justify-end gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || !selectedSessionZoneId
                                    }
                                    className="w-full font-black tracking-widest uppercase shadow-lg shadow-neutral-200 dark:shadow-neutral-950"
                                >
                                    {processing && (
                                        <Spinner className="mr-2 h-4 w-4" />
                                    )}
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
