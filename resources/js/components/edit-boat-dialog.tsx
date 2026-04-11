import { Form } from '@inertiajs/react';
import { Pencil, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { update } from '@/routes/boats';
import { Account } from '@/types/accounts';

interface Boat {
    id: number;
    name: string;
    account_id: number;
}

interface Props {
    boat: Boat;
    accounts: Account[];
}

export default function EditBoatDialog({ boat, accounts }: Props) {
    const [open, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState(boat.account_id?.toString() || "");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Modifier le bateau</DialogTitle>
                    <DialogDescription>
                        Mise à jour des informations pour **{boat.name}**.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(boat.id)}
                    onSuccess={() => {
                        toast.success('Bateau mis à jour ! 🚢');
                        setOpen(false);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="account_id" value={selectedAccountId} />

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nom du bateau</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={boat.name}
                                    required
                                    placeholder="ex: Al Boughaz"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Propriétaire</Label>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={popoverOpen}
                                            className={cn(
                                                "w-full justify-between font-normal",
                                                !selectedAccountId && "text-muted-foreground"
                                            )}
                                        >
                                            {selectedAccountId
                                                ? accounts.find((a) => a.id.toString() === selectedAccountId)?.name
                                                : "Choisir un compte..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Rechercher..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun compte.</CommandEmpty>
                                                <CommandGroup>
                                                    {accounts.map((account) => (
                                                        <CommandItem
                                                            key={account.id}
                                                            value={account.name}
                                                            onSelect={() => {
                                                                setSelectedAccountId(account.id.toString());
                                                                setPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedAccountId === account.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {account.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.account_id} />
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
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : 'Enregistrer'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}