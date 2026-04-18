import { Form } from '@inertiajs/react';
import { Plus, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn, commandItemClass } from "@/lib/utils";
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
import { store } from '@/routes/items';
import { Category } from '@/types/category';

interface Props {
    categories: Category[];
}

export default function AddItemDialog({ categories }: Props) {
    const [open, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un article
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nouvel article</DialogTitle>
                    <DialogDescription>
                        Entrez les détails de l'article et choisissez une catégorie.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    resetOnSuccess={['name']}
                    onSuccess={() => {
                        toast.success('L\'article a été créé ! ✨');
                        setOpen(false);
                        setSelectedCategoryId("");
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Hidden input to pass the selected category ID */}
                            <input type="hidden" name="category_id" value={selectedCategoryId} />

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nom de l'article</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="ex: Fournitures de bureau..."
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Catégorie</Label>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between font-normal",
                                                !selectedCategoryId && "text-muted-foreground"
                                            )}
                                        >
                                            {selectedCategoryId
                                                ? categories.find((c) => c.id.toString() === selectedCategoryId)?.name
                                                : "Choisir une catégorie..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Rechercher..." />
                                            <CommandList>
                                                <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                                                <CommandGroup>
                                                    {categories.map((category) => (
                                                        <CommandItem
                                                            className={commandItemClass}
                                                            key={category.id}
                                                            value={category.name}
                                                            onSelect={() => {
                                                                setSelectedCategoryId(category.id.toString());
                                                                setPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedCategoryId === category.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {category.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.category_id} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
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
                                    className="min-w-[100px]"
                                >
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