import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import MissingCategoryPopup from '@/components/missing-category-popup';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { cn, commandItemClass } from '@/lib/utils';
import { bulkStore } from '@/routes/items';
import type { Category } from '@/types/category';

interface Props {
    categories: Category[];
}

interface ItemRow {
    id: number;
    name: string;
    categoryId: string;
}

interface FlashMessage {
    success?: string;
    error?: string;
}

let itemRowId = 0;

function createItemRow(name = '', categoryId = ''): ItemRow {
    itemRowId += 1;

    return { id: itemRowId, name, categoryId };
}

/**
 * Découpe un collage multi-lignes (Excel, WhatsApp...) en liste de noms.
 */
function splitPastedNames(pasted: string): string[] {
    return pasted
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter((name) => name !== '');
}

interface ItemRowFieldsProps {
    row: ItemRow;
    index: number;
    categories: Category[];
    autoFocus: boolean;
    canRemove: boolean;
    nameError?: string;
    categoryError?: string;
    onNameChange: (name: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onPasteNames: (names: string[]) => void;
    onAddRow: () => void;
    onRemove: () => void;
}

/**
 * Une ligne du formulaire : le nom de l'article avec sa catégorie.
 */
function ItemRowFields({
    row,
    index,
    categories,
    autoFocus,
    canRemove,
    nameError,
    categoryError,
    onNameChange,
    onCategoryChange,
    onPasteNames,
    onAddRow,
    onRemove,
}: ItemRowFieldsProps) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const selectedCategory = categories.find(
        (category) => category.id.toString() === row.categoryId,
    );

    const trimmedSearch = categorySearch.trim();
    const hasMatch = categories.some((category) =>
        category.name.toLowerCase().includes(trimmedSearch.toLowerCase()),
    );

    return (
        <div className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <div className="grid min-w-0 gap-1">
                    <Input
                        id={`item-name-${index}`}
                        name={`items[${index}][name]`}
                        value={row.name}
                        autoComplete="off"
                        autoFocus={autoFocus}
                        placeholder={
                            index === 0
                                ? 'ex: poulpe g, calamar m...'
                                : 'Autre article...'
                        }
                        onChange={(event) => {
                            onNameChange(event.target.value);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                onAddRow();
                            }
                        }}
                        onPaste={(event) => {
                            const pasted = event.clipboardData.getData('text');

                            if (!pasted.includes('\n')) {
                                return;
                            }

                            const pastedNames = splitPastedNames(pasted);

                            if (pastedNames.length === 0) {
                                return;
                            }

                            event.preventDefault();
                            onPasteNames(pastedNames);
                        }}
                    />
                    <InputError message={nameError} />
                </div>

                <div className="grid min-w-0 gap-1">
                    <input
                        type="hidden"
                        name={`items[${index}][category_id]`}
                        value={row.categoryId}
                    />

                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    'w-full justify-between font-normal',
                                    !row.categoryId && 'text-muted-foreground',
                                    categoryError && 'border-destructive',
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

                                    {trimmedSearch && !hasMatch && (
                                        <div className="shrink-0">
                                            <MissingCategoryPopup
                                                initialName={trimmedSearch}
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
                                                    onCategoryChange(
                                                        category.id.toString(),
                                                    );
                                                    setPopoverOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        row.categoryId ===
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

                    <InputError message={categoryError} />
                </div>
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Supprimer la ligne ${index + 1}`}
                disabled={!canRemove}
                className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                onClick={onRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

export default function AddItemDialog({ categories }: Props) {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<ItemRow[]>([createItemRow()]);
    const [formKey, setFormKey] = useState(0);

    const readyRows = rows.filter(
        (row) => row.name.trim() !== '' && row.categoryId !== '',
    );

    const filledCount = readyRows.length;

    const hasIncompleteRow = rows.some(
        (row) => (row.name.trim() === '') !== (row.categoryId === ''),
    );

    const addRow = () => {
        setRows((current) => [...current, createItemRow()]);
    };

    const removeRow = (id: number) => {
        if (rows.length === 1) {
            return;
        }

        setRows((current) => current.filter((row) => row.id !== id));
    };

    const updateRow = (id: number, patch: Partial<Omit<ItemRow, 'id'>>) => {
        setRows((current) =>
            current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        );
    };

    /**
     * Remplace la ligne collée, puis ajoute une ligne par nom supplémentaire.
     */
    const pasteRows = (index: number, names: string[]) => {
        setRows((current) => {
            const updated = [...current];
            updated[index] = createItemRow(names[0]);

            return [
                ...updated,
                ...names.slice(1).map((name) => createItemRow(name)),
            ];
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un article
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nouveaux articles</DialogTitle>
                    <DialogDescription>
                        Ajoutez un ou plusieurs articles d&apos;un coup, chacun
                        avec sa catégorie. Les articles déjà existants sont
                        ignorés automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...bulkStore.form()}
                    key={formKey}
                    transform={() => ({
                        items: readyRows.map((row) => ({
                            name: row.name.trim(),
                            category_id: row.categoryId,
                        })),
                    })}
                    onBefore={() => {
                        if (filledCount === 0) {
                            toast.error(
                                'Ajoutez au moins un article avec sa catégorie.',
                            );

                            return false;
                        }

                        if (hasIncompleteRow) {
                            toast.error(
                                'Chaque article doit avoir un nom et une catégorie.',
                            );

                            return false;
                        }

                        return true;
                    }}
                    onSuccess={(page) => {
                        const flash = page.props.flash as
                            | FlashMessage
                            | undefined;

                        toast.success(
                            flash?.success ??
                                'Les articles ont été enregistrés ! ✅',
                        );

                        setRows([createItemRow()]);
                        setFormKey((key) => key + 1);
                        setOpen(false);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors, clearErrors }) => (
                        <>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="item-name-0">
                                        Article et catégorie
                                    </Label>

                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {filledCount} article(s)
                                    </span>
                                </div>

                                <ScrollArea className="max-h-80">
                                    <div className="space-y-2 pr-3">
                                        {rows.map((row, index) => (
                                            <ItemRowFields
                                                key={row.id}
                                                row={row}
                                                index={index}
                                                categories={categories}
                                                autoFocus={
                                                    index === rows.length - 1
                                                }
                                                canRemove={rows.length > 1}
                                                nameError={
                                                    errors[
                                                        `items.${index}.name`
                                                    ]
                                                }
                                                categoryError={
                                                    errors[
                                                        `items.${index}.category_id`
                                                    ]
                                                }
                                                onNameChange={(name) => {
                                                    updateRow(row.id, { name });
                                                }}
                                                onCategoryChange={(
                                                    categoryId,
                                                ) => {
                                                    updateRow(row.id, {
                                                        categoryId,
                                                    });
                                                }}
                                                onPasteNames={(names) => {
                                                    clearErrors();
                                                    pasteRows(index, names);
                                                }}
                                                onAddRow={() => {
                                                    addRow();
                                                }}
                                                onRemove={() => {
                                                    clearErrors();
                                                    removeRow(row.id);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>

                                <InputError message={errors.items} />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full border-dashed border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
                                onClick={() => {
                                    addRow();
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Ajouter une
                                ligne
                            </Button>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Astuce : appuyez sur{' '}
                                <span className="font-semibold">Entrée</span>{' '}
                                pour ajouter un article, ou collez une colonne
                                entière depuis Excel.
                            </p>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full"
                                >
                                    {processing && <Spinner className="mr-2" />}
                                    Enregistrer {filledCount} article(s)
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
