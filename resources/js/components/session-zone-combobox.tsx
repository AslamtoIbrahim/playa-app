import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowRight, Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

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
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn, commandItemClass } from '@/lib/utils';
import type { SessionZone } from '@/types/session-zone';

export interface SessionZoneComboboxProps {
    sessionZones: SessionZone[];
    value: string;
    onChange: (sessionZoneId: string) => void;
    error?: string;
    label?: string;
    placeholder?: string;
    /** Affiche le lien vers la gestion des journées. */
    showManageLink?: boolean;
    disabled?: boolean;
}

const formatSessionDate = (date?: string | null): string => {
    if (!date) {
        return 'N/A';
    }

    return format(new Date(date), 'dd/MM/yyyy');
};

/**
 * Sélection d'une journée / zone d'affectation.
 * Utilisé à la fois pour la liste globale (page Factures) et pour la liste
 * restreinte aux zones de la journée courante.
 */
export function SessionZoneCombobox({
    sessionZones,
    value,
    onChange,
    error,
    label = "Session & Zone d'affectation",
    placeholder = 'Choisir la session/zone...',
    showManageLink = true,
    disabled = false,
}: SessionZoneComboboxProps) {
    const [open, setOpen] = useState<boolean>(false);

    const selectedSessionZone =
        sessionZones.find(
            (sessionZone) => sessionZone.id.toString() === value,
        ) ?? null;

    const triggerLabel = selectedSessionZone
        ? `${formatSessionDate(selectedSessionZone.daily_session?.session_date)} - ${selectedSessionZone.zone?.name ?? 'Inconnue'}`
        : placeholder;

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-500 uppercase dark:text-neutral-400">
                    {label}
                </Label>

                {showManageLink && (
                    <Link
                        href="/sessions"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                        Gérer les sessions <ArrowRight className="h-2 w-2" />
                    </Link>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        disabled={disabled}
                        className={cn(
                            'w-full justify-between font-medium',
                            !selectedSessionZone && 'text-muted-foreground',
                            error && 'border-destructive',
                        )}
                    >
                        {triggerLabel}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Rechercher une zone ou date..." />

                        <CommandList>
                            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

                            <CommandGroup>
                                {sessionZones.map((sessionZone) => (
                                    <CommandItem
                                        className={commandItemClass}
                                        key={sessionZone.id}
                                        value={`${sessionZone.daily_session?.session_date} ${sessionZone.zone?.name}`}
                                        onSelect={() => {
                                            onChange(sessionZone.id.toString());
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value ===
                                                    sessionZone.id.toString()
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />

                                        <div className="flex flex-col">
                                            <span className="capitalize">
                                                {sessionZone.zone?.name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-neutral-400">
                                                Journée du{' '}
                                                {formatSessionDate(
                                                    sessionZone.daily_session
                                                        ?.session_date,
                                                )}
                                            </span>
                                        </div>

                                        <span
                                            className={cn(
                                                'ml-auto rounded-sm px-1.5 py-0.5 text-[10px] uppercase',
                                                sessionZone.daily_session
                                                    ?.status === 'open'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300',
                                            )}
                                        >
                                            {sessionZone.daily_session?.status}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <InputError message={error} />
        </div>
    );
}

export default SessionZoneCombobox;
