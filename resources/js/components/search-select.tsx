import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn, commandItemClass } from '@/lib/utils';
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface SearchSelectProps {
    value: string | number | undefined;
    options: { id: string | number; name: string }[];
    placeholder: string;
    emptyMessage?: string;
    onSelect: (id: string | number) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onKeyDown?: (e: React.KeyboardEvent<any>) => void;
    className?: string;
}

export function SearchSelect({
    value,
    options,
    placeholder,
    emptyMessage = "Aucun résultat.",
    onSelect,
    open,
    onOpenChange,
    onKeyDown,
    className,
}: SearchSelectProps) {
    const selectedOption = options.find((opt) => String(opt.id) === String(value));

    // const commandItemClass = 'text-xs !bg-white cursor-pointer flex items-center gap-2 px-3 py-2 rounded-sm outline-none data-[selected=true]:!bg-slate-200 data-[selected=true]:!text-black transition-colors';

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    onKeyDown={onKeyDown}
                    className={cn("h-10 w-full justify-between px-3 text-left text-xs font-normal", className)}
                >
                    <span className={cn('truncate', !value && 'text-slate-400 italic')}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                    <ChevronsUpDown className="h-3 w-3 opacity-20 print:hidden" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Rechercher..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup className="p-1">
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.id}
                                    value={opt.name}
                                    onSelect={() => {
                                        onSelect(opt.id);
                                    }}
                                    className={commandItemClass}
                                >
                                    <Check
                                        className={cn(
                                            'h-3.5 w-3.5 text-blue-600',
                                            String(value) === String(opt.id) ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                    <span>{opt.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}