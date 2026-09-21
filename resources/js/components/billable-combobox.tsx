import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import MissingCustomerCompanyPopup from '@/components/missing-customer-company-popup';
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
import type { Billable } from '@/types/invoice';

export interface BillableComboboxProps {
    billables: Billable[];
    value: Billable | null;
    onChange: (billable: Billable) => void;
    error?: string;
    label?: string;
    disabled?: boolean;
}

/**
 * Sélection d'un compte : client ou société (relation polymorphique `billable`).
 */
export function BillableCombobox({
    billables,
    value,
    onChange,
    error,
    label = 'Compte / Client',
    disabled = false,
}: BillableComboboxProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [search, setSearch] = useState('');

    const trimmedSearch = search.trim();
    const hasMatch = billables.some((billable) =>
        billable.name.toLowerCase().includes(trimmedSearch.toLowerCase()),
    );

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
                            !value && 'text-muted-foreground',
                            error && 'border-destructive',
                        )}
                    >
                        {value ? value.name : 'Sélectionner un compte...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <div className="flex items-center gap-2 p-2">
                            <CommandInput
                                placeholder="Rechercher..."
                                value={search}
                                onValueChange={setSearch}
                                className="h-9 flex-1 p-0"
                            />

                            {trimmedSearch && !hasMatch && (
                                <MissingCustomerCompanyPopup
                                    initialName={trimmedSearch}
                                />
                            )}
                        </div>

                        <CommandList>
                            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

                            <CommandGroup>
                                {billables.map((billable) => (
                                    <CommandItem
                                        className={commandItemClass}
                                        key={`${billable.type}-${billable.id}`}
                                        value={billable.name}
                                        onSelect={() => {
                                            onChange(billable);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value?.id === billable.id &&
                                                    value?.type ===
                                                        billable.type
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        {billable.name}
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

export default BillableCombobox;
