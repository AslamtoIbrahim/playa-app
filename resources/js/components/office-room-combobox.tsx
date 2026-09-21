import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import MissingOfficePopup from '@/components/missing-office-popup';
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
import type { OfficeRoom } from '@/types/office-room';

export interface OfficeRoomComboboxProps {
    officeRooms: OfficeRoom[];
    value: string;
    onChange: (officeRoomId: string) => void;
    error?: string;
    label?: string;
    /** Ce qui est affiché dans le déclencheur : la ville (défaut) ou le nom du bureau. */
    display?: 'city' | 'name';
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Sélection d'un bureau / ville, avec création rapide si le bureau n'existe pas.
 */
export function OfficeRoomCombobox({
    officeRooms,
    value,
    onChange,
    error,
    label = 'Bureau / Ville',
    display = 'city',
    placeholder = 'Sélectionner un bureau...',
    disabled = false,
}: OfficeRoomComboboxProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [search, setSearch] = useState('');

    const selectedOfficeRoom =
        officeRooms.find((officeRoom) => officeRoom.id.toString() === value) ??
        null;

    const trimmedSearch = search.trim();
    const hasMatch = officeRooms.some((officeRoom) =>
        `${officeRoom.name} ${officeRoom.city}`
            .toLowerCase()
            .includes(trimmedSearch.toLowerCase()),
    );

    const triggerLabel = selectedOfficeRoom
        ? display === 'name'
            ? selectedOfficeRoom.name
            : selectedOfficeRoom.city
        : placeholder;

    return (
        <div className="grid gap-2">
            <Label className="text-xs font-bold text-slate-500 uppercase dark:text-neutral-400">
                {label}
            </Label>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        disabled={disabled}
                        className={cn(
                            'w-full justify-between font-medium',
                            !selectedOfficeRoom && 'text-muted-foreground',
                            error && 'border-destructive',
                        )}
                    >
                        {triggerLabel}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <div className="flex items-center gap-2 p-2">
                            <CommandInput
                                placeholder="Rechercher un bureau..."
                                value={search}
                                onValueChange={setSearch}
                                className="h-9 flex-1 p-0"
                            />

                            {trimmedSearch && !hasMatch && (
                                <MissingOfficePopup />
                            )}
                        </div>

                        <CommandList>
                            <CommandEmpty>Aucun bureau trouvé.</CommandEmpty>

                            <CommandGroup>
                                {officeRooms.map((officeRoom) => (
                                    <CommandItem
                                        className={commandItemClass}
                                        key={officeRoom.id}
                                        value={
                                            officeRoom.name +
                                            ' ' +
                                            officeRoom.city
                                        }
                                        onSelect={() => {
                                            onChange(officeRoom.id.toString());
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value ===
                                                    officeRoom.id.toString()
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        {officeRoom.name} ({officeRoom.city})
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

export default OfficeRoomCombobox;
