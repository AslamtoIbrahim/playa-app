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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn, commandItemClass } from '@/lib/utils';
import { store } from '@/routes/cautions';
import { Owner } from '@/types/caution';
import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    owners: Owner[];
}

export default function AddCautionDialog({ owners }: Props) {
    const [open, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedOwnerId, setSelectedOwnerId] = useState('');
    const [selectedOwnerType, setSelectedOwnerType] = useState('');

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            {
                e.preventDefault();  
                setPopoverOpen(true);  
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une caution
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nouvelle caution</DialogTitle>
                    <DialogDescription>
                        Créez une nouvelle caution et affectez-la à un propriétaire.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    resetOnSuccess={['name']}
                    onSuccess={() => {
                        toast.success('Caution ajoutée avec succès ! 🛡️');
                        setOpen(false);
                        setSelectedOwnerId('');
                        setSelectedOwnerType('');
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="owner_id"
                                value={selectedOwnerId}
                            />

                            <input
                                type="hidden"
                                name="owner_type"
                                value={selectedOwnerType}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="name">Désignation de la caution</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="ex: Caution Sabrimar"
                                    autoFocus
                                    onKeyDown={handleNameKeyDown}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Propriétaire</Label>
                                <Popover
                                    open={popoverOpen}
                                    onOpenChange={setPopoverOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={popoverOpen}
                                            className={cn(
                                                'w-full justify-between font-normal',
                                                !selectedOwnerId &&
                                                'text-muted-foreground',
                                            )}
                                        >
                                            {selectedOwnerId
                                                ? owners.find(
                                                    (o) =>
                                                        o.id.toString() === selectedOwnerId &&
                                                        o.type === selectedOwnerType
                                                )?.name
                                                : 'Choisir un propriétaire...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        className="w-(--radix-popover-trigger-width) p-0"
                                        align="start"
                                    >
                                        <Command>
                                            <CommandInput placeholder="Rechercher un client ou société..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    Aucun résultat trouvé.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {owners.map((owner) => (
                                                        <CommandItem
                                                            className={commandItemClass}
                                                            key={`${owner.id}-${owner.type}`}
                                                            value={`${owner.name}-${owner.type}`}
                                                            onSelect={() => {
                                                                setSelectedOwnerId(owner.id.toString());
                                                                setSelectedOwnerType(owner.type);
                                                                setPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    selectedOwnerId === owner.id.toString() &&
                                                                        selectedOwnerType === owner.type
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span>{owner.name}</span>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {owner.type.includes('Customer') ? 'Client' : 'Société'}
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.owner_id} />
                                <InputError message={errors.owner_type} />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={processing}
                                >
                                    Annuler
                                </Button>

                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        'Enregistrer'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}