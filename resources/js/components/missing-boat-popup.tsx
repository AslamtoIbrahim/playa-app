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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn, commandItemClass } from '@/lib/utils';
import { store as boatStore } from '@/routes/boats';
import type { Owner } from '@/types/boat';
import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import MissingCustomerCompanyPopup from './missing-customer-company-popup';

type MissingBoatPopupProps = {
    initialName?: string;
    owners: Owner[];
};

export default function MissingBoatPopup({
    initialName = '',
    owners,
}: MissingBoatPopupProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(initialName);
    const [ownerId, setOwnerId] = useState('');
    const [ownerType, setOwnerType] = useState('');
    const [ownerOpen, setOwnerOpen] = useState(false);
    const [ownerSearch, setOwnerSearch] = useState('');

    const selectedOwner = owners.find(
        (owner) => owner.id.toString() === ownerId && owner.type === ownerType,
    );

    const trimmedOwnerSearch = ownerSearch.trim();
    const ownerHasMatch = owners.some((owner) =>
        owner.name.toLowerCase().includes(trimmedOwnerSearch.toLowerCase()),
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (nextOpen) {
                    setName(initialName);
                    setOwnerId('');
                    setOwnerType('');
                    setOwnerSearch('');
                    setOwnerOpen(false);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Ajouter un bateau</DialogTitle>
                    <DialogDescription>
                        Ce bateau n&apos;est pas dans les suggestions.
                        Ajoutez-le directement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...boatStore.form()}
                    onBefore={() => {
                        if (name.trim() === '') {
                            toast.error('Le nom du bateau est obligatoire.');

                            return false;
                        }

                        if (ownerId === '' || ownerType === '') {
                            toast.error('Veuillez choisir un propriétaire.');

                            return false;
                        }

                        return true;
                    }}
                    onSuccess={() => {
                        toast.success('Le bateau a été créé avec succès !');
                        setOpen(false);
                    }}
                    onError={(errors) => {
                        const firstError = Object.values(errors)[0];

                        if (firstError) {
                            toast.error(firstError);
                        }
                    }}
                    className="w-full min-w-0 space-y-4 pt-2"
                >
                    <Input
                        className="w-full min-w-0"
                        name="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Nom du bateau"
                        required
                        autoFocus
                    />

                    <input type="hidden" name="owner_id" value={ownerId} />

                    <input type="hidden" name="owner_type" value={ownerType} />

                    <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    'w-full justify-between font-normal',
                                    !ownerId && 'text-muted-foreground',
                                )}
                            >
                                <span className="truncate">
                                    {selectedOwner?.name ??
                                        'Choisir un propriétaire...'}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-(--radix-popover-trigger-width) p-0"
                            align="start"
                        >
                            <Command>
                                <div className="flex items-center gap-2 p-1">
                                    <div className="min-w-0 flex-1">
                                        <CommandInput
                                            placeholder="Rechercher..."
                                            value={ownerSearch}
                                            onValueChange={setOwnerSearch}
                                        />
                                    </div>

                                    {trimmedOwnerSearch !== '' &&
                                        !ownerHasMatch && (
                                            <div className="shrink-0">
                                                <MissingCustomerCompanyPopup
                                                    initialName={
                                                        trimmedOwnerSearch
                                                    }
                                                />
                                            </div>
                                        )}
                                </div>
                                <CommandList>
                                    <CommandEmpty>
                                        Aucun propriétaire trouvé.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {owners.map((owner) => (
                                            <CommandItem
                                                className={commandItemClass}
                                                key={`${owner.id}-${owner.type}`}
                                                value={`${owner.name}-${owner.type}`}
                                                onSelect={() => {
                                                    setOwnerId(
                                                        owner.id.toString(),
                                                    );
                                                    setOwnerType(owner.type);
                                                    setOwnerOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        ownerId ===
                                                            owner.id.toString() &&
                                                            ownerType ===
                                                                owner.type
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span>{owner.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {owner.type.includes(
                                                            'Customer',
                                                        )
                                                            ? 'Client'
                                                            : 'Société'}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <DialogFooter className="w-full min-w-0 pt-2">
                        <Button type="submit" className="w-full min-w-0">
                            Ajouter le bateau
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
