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
import { update } from '@/routes/cautions';
import { Caution, Owner } from '@/types/caution';
import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, Loader2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    caution: Caution;
    owners: Owner[];
}

export default function EditCautionDialog({ caution, owners }: Props) {
    const [open, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const [selectedOwnerId, setSelectedOwnerId] = useState(
        caution.owner_id?.toString() || '',
    );

    const [selectedOwnerType, setSelectedOwnerType] = useState(
        caution.owner_type || '',
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Modifier la caution</DialogTitle>
                    <DialogDescription>
                        Mise à jour des informations pour **{caution.name}**.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(caution.id)}
                    onSuccess={() => {
                        toast.success('Caution mise à jour ! 🛡️');
                        setOpen(false);
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
                                <Label htmlFor="name">Désignation</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={caution.name}
                                    required
                                    placeholder="ex: Caution Sabrimar"
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
                                            <CommandInput placeholder="Rechercher..." />
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
                                    onClick={() => {
                                        setOpen(false);
                                    }}
                                    disabled={processing}
                                >
                                    Annuler
                                </Button>

                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Mise à jour...
                                        </>
                                    ) : (
                                        'Enregistrer les modifications'
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