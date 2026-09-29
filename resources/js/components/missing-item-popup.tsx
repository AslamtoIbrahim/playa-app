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
import { store as itemStore } from '@/routes/items';
import type { Category } from '@/types/category';
import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import MissingCategoryPopup from './missing-category-popup';

type MissingItemPopupProps = {
    initialName?: string;
    categories: Category[];
};

export default function MissingItemPopup({
    initialName = '',
    categories,
}: MissingItemPopupProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(initialName);
    const [categoryId, setCategoryId] = useState('');
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const selectedCategory = categories.find(
        (category) => category.id.toString() === categoryId,
    );

    const trimmedCategorySearch = categorySearch.trim();
    const categoryHasMatch = categories.some((category) =>
        category.name
            .toLowerCase()
            .includes(trimmedCategorySearch.toLowerCase()),
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (nextOpen) {
                    setName(initialName);
                    setCategoryId('');
                    setCategorySearch('');
                    setCategoryOpen(false);
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
                    <DialogTitle>Ajouter une espèce</DialogTitle>
                    <DialogDescription>
                        Cette espèce n&apos;est pas dans les suggestions.
                        Ajoutez-la directement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...itemStore.form()}
                    onBefore={() => {
                        if (name.trim() === '') {
                            toast.error("Le nom de l'espèce est obligatoire.");

                            return false;
                        }

                        if (categoryId === '') {
                            toast.error('Veuillez choisir une catégorie.');

                            return false;
                        }

                        return true;
                    }}
                    onSuccess={() => {
                        toast.success("L'espèce a été créée avec succès !");
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
                        placeholder="Nom de l'espèce"
                        required
                        autoFocus
                    />

                    <input
                        type="hidden"
                        name="category_id"
                        value={categoryId}
                    />

                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    'w-full justify-between font-normal',
                                    !categoryId && 'text-muted-foreground',
                                )}
                            >
                                <span className="truncate">
                                    {selectedCategory?.name ??
                                        'Choisir une catégorie...'}
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
                                            value={categorySearch}
                                            onValueChange={setCategorySearch}
                                        />
                                    </div>

                                    {trimmedCategorySearch !== '' &&
                                        !categoryHasMatch && (
                                            <div className="shrink-0">
                                                <MissingCategoryPopup
                                                    initialName={
                                                        trimmedCategorySearch
                                                    }
                                                />
                                            </div>
                                        )}
                                </div>
                                <CommandList>
                                    <CommandEmpty>
                                        Aucune catégorie trouvée.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {categories.map((category) => (
                                            <CommandItem
                                                className={commandItemClass}
                                                key={category.id}
                                                value={category.name}
                                                onSelect={() => {
                                                    setCategoryId(
                                                        category.id.toString(),
                                                    );
                                                    setCategoryOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        categoryId ===
                                                            category.id.toString()
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
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

                    <DialogFooter className="w-full min-w-0 pt-2">
                        <Button type="submit" className="w-full min-w-0">
                            Ajouter l&apos;espèce
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
