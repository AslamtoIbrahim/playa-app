import { Check, ChevronsUpDown } from 'lucide-react';
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
import type { Caution } from '@/types/caution';
import type { Billable } from '@/types/invoice';

export interface CautionComboboxProps {
    /** Cautions du compte sélectionné (déjà filtrées). */
    cautions: Caution[];
    /** Compte sélectionné : conditionne l'activation du champ. */
    billable: Billable | null;
    value: string;
    onChange: (cautionId: string) => void;
    error?: string;
    label?: string;
    disabled?: boolean;
}

/**
 * Sélection d'une caution rattachée au compte sélectionné.
 */
export function CautionCombobox({
    cautions,
    billable,
    value,
    onChange,
    error,
    label = 'Caution associée',
    disabled = false,
}: CautionComboboxProps) {
    const [open, setOpen] = useState<boolean>(false);

    const selectedCaution =
        cautions.find((caution) => caution.id.toString() === value) ?? null;
    const isDisabled = disabled || !billable;

    const placeholder = billable
        ? 'Sélectionner une caution...'
        : "Sélectionnez d'abord un compte";

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
                        disabled={isDisabled}
                        className={cn(
                            'w-full justify-between font-medium',
                            !selectedCaution && 'text-muted-foreground',
                            error && 'border-destructive',
                        )}
                    >
                        {selectedCaution ? selectedCaution.name : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Rechercher une caution..." />

                        <CommandList>
                            <CommandEmpty>Aucune caution trouvée.</CommandEmpty>

                            <CommandGroup>
                                {cautions.map((caution) => (
                                    <CommandItem
                                        className={commandItemClass}
                                        key={caution.id}
                                        value={caution.name}
                                        onSelect={() => {
                                            onChange(caution.id.toString());
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === caution.id.toString()
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        {caution.name}
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

export default CautionCombobox;
