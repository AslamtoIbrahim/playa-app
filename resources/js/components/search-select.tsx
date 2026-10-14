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
    disabled?: boolean;
    className?: string;
    /**
     * Action optionnelle rendue à côté du champ de recherche lorsque la
     * valeur saisie n'existe pas dans les options (ex : bouton "+" pour
     * créer l'élément manquant).
     */
    renderNoMatchAction?: (search: string) => React.ReactNode;
}

export function SearchSelect({
    value,
    options,
    placeholder,
    emptyMessage = 'Aucun résultat.',
    onSelect,
    open,
    onOpenChange,
    onKeyDown,
    disabled = false,
    className,
    renderNoMatchAction,
}: SearchSelectProps) {
    const [search, setSearch] = React.useState('');
    const popoverRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (open) {
            requestAnimationFrame(() => {
                popoverRef.current
                    ?.querySelector<HTMLInputElement>('[cmdk-input]')
                    ?.focus();
            });
        }
    }, [open]);
    const selectedOption = options.find(
        (opt) => String(opt.id) === String(value),
    );

    const trimmedSearch = search.trim();
    const hasMatch = options.some((opt) =>
        opt.name.toLowerCase().includes(trimmedSearch.toLowerCase()),
    );

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setSearch('');
        }

        onOpenChange(nextOpen);
    };

    const showNoMatchAction =
        renderNoMatchAction !== undefined && trimmedSearch !== '' && !hasMatch;

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    disabled={disabled}
                    onKeyDown={(event) => {
                        onKeyDown?.(event);

                        if (
                            !event.defaultPrevented &&
                            event.key.length === 1 &&
                            !event.altKey &&
                            !event.ctrlKey &&
                            !event.metaKey
                        ) {
                            event.preventDefault();
                            setSearch(event.key);
                            onOpenChange(true);
                        }
                    }}
                    className={cn(
                        'h-10 w-full justify-between px-3 text-left text-xs font-normal',
                        className,
                    )}
                >
                    <span
                        className={cn(
                            'truncate',
                            !value && 'text-slate-400 italic',
                        )}
                    >
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                    <ChevronsUpDown className="h-3 w-3 opacity-20 print:hidden" />
                </Button>
            </PopoverTrigger>
            <PopoverContent ref={popoverRef} className="w-64 p-0" align="start">
                <Command>
                    <div className="flex items-center gap-2 p-1">
                        <div className="min-w-0 flex-1">
                            <CommandInput
                                placeholder="Rechercher..."
                                className="h-9"
                                value={search}
                                onValueChange={setSearch}
                            />
                        </div>

                        {showNoMatchAction && (
                            <div className="shrink-0">
                                {renderNoMatchAction(trimmedSearch)}
                            </div>
                        )}
                    </div>
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup className="p-1">
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.id}
                                    value={opt.name}
                                    onSelect={() => {
                                        onSelect(opt.id);
                                        handleOpenChange(false);
                                    }}
                                    className={commandItemClass}
                                >
                                    <Check
                                        className={cn(
                                            'h-3.5 w-3.5 text-blue-600',
                                            String(value) === String(opt.id)
                                                ? 'opacity-100'
                                                : 'opacity-0',
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
