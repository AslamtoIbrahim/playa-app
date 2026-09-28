import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { bulkStore } from '@/routes/cautions';
import type { Owner } from '@/types/caution';

interface Props {
    owners: Owner[];
}

interface CautionRow {
    id: number;
    name: string;
    ownerId: string;
    ownerType: string;
}

interface FlashMessage {
    success?: string;
    error?: string;
}

let cautionRowId = 0;

function createCautionRow(name = '', ownerId = '', ownerType = ''): CautionRow {
    cautionRowId += 1;

    return { id: cautionRowId, name, ownerId, ownerType };
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

interface CautionRowFieldsProps {
    row: CautionRow;
    index: number;
    owners: Owner[];
    autoFocus: boolean;
    canRemove: boolean;
    nameError?: string;
    ownerError?: string;
    onNameChange: (name: string) => void;
    onOwnerChange: (ownerId: string, ownerType: string) => void;
    onPasteNames: (names: string[]) => void;
    onAddRow: () => void;
    onRemove: () => void;
}

/**
 * Une ligne du formulaire : le nom de la caution avec son propriétaire.
 */
function CautionRowFields({
    row,
    index,
    owners,
    autoFocus,
    canRemove,
    nameError,
    ownerError,
    onNameChange,
    onOwnerChange,
    onPasteNames,
    onAddRow,
    onRemove,
}: CautionRowFieldsProps) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [ownerSearch, setOwnerSearch] = useState('');

    const selectedOwner = owners.find(
        (owner) =>
            owner.id.toString() === row.ownerId && owner.type === row.ownerType,
    );

    const trimmedSearch = ownerSearch.trim();
    const hasMatch = owners.some((owner) =>
        owner.name.toLowerCase().includes(trimmedSearch.toLowerCase()),
    );

    return (
        <div className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <div className="grid min-w-0 gap-1">
                    <Input
                        id={`caution-name-${index}`}
                        name={`cautions[${index}][name]`}
                        value={row.name}
                        autoComplete="off"
                        autoFocus={autoFocus}
                        placeholder={
                            index === 0
                                ? 'ex: Caution Sabrimar, Dépôt Cash X...'
                                : 'Autre caution...'
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
                        name={`cautions[${index}][owner_id]`}
                        value={row.ownerId}
                    />

                    <input
                        type="hidden"
                        name={`cautions[${index}][owner_type]`}
                        value={row.ownerType}
                    />

                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    'w-full justify-between font-normal',
                                    !row.ownerId && 'text-muted-foreground',
                                    ownerError && 'border-destructive',
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
                                            placeholder="Rechercher un client ou société..."
                                            value={ownerSearch}
                                            onValueChange={setOwnerSearch}
                                        />
                                    </div>

                                    {trimmedSearch && !hasMatch && (
                                        <div className="shrink-0">
                                            <MissingCustomerCompanyPopup
                                                initialName={trimmedSearch}
                                            />
                                        </div>
                                    )}
                                </div>
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
                                                    onOwnerChange(
                                                        owner.id.toString(),
                                                        owner.type,
                                                    );
                                                    setPopoverOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        row.ownerId ===
                                                            owner.id.toString() &&
                                                            row.ownerType ===
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

                    <InputError message={ownerError} />
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

export default function AddCautionDialog({ owners }: Props) {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<CautionRow[]>([createCautionRow()]);
    const [formKey, setFormKey] = useState(0);

    const readyRows = rows.filter(
        (row) => row.name.trim() !== '' && row.ownerId !== '',
    );

    const filledCount = readyRows.length;

    const hasIncompleteRow = rows.some(
        (row) => (row.name.trim() === '') !== (row.ownerId === ''),
    );

    const addRow = () => {
        setRows((current) => [...current, createCautionRow()]);
    };

    const removeRow = (id: number) => {
        if (rows.length === 1) {
            return;
        }

        setRows((current) => current.filter((row) => row.id !== id));
    };

    const updateRow = (id: number, patch: Partial<Omit<CautionRow, 'id'>>) => {
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
            updated[index] = createCautionRow(names[0]);

            return [
                ...updated,
                ...names.slice(1).map((name) => createCautionRow(name)),
            ];
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une caution
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nouvelles cautions</DialogTitle>
                    <DialogDescription>
                        Ajoutez une ou plusieurs cautions d&apos;un coup,
                        chacune avec son propriétaire. Les cautions déjà
                        existantes sont ignorées automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...bulkStore.form()}
                    key={formKey}
                    transform={() => ({
                        cautions: readyRows.map((row) => ({
                            name: row.name.trim(),
                            owner_id: row.ownerId,
                            owner_type: row.ownerType,
                        })),
                    })}
                    onBefore={() => {
                        if (filledCount === 0) {
                            toast.error(
                                'Ajoutez au moins une caution avec son propriétaire.',
                            );

                            return false;
                        }

                        if (hasIncompleteRow) {
                            toast.error(
                                'Chaque caution doit avoir un nom et un propriétaire.',
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
                                'Les cautions ont été enregistrées ! 🛡️',
                        );

                        setRows([createCautionRow()]);
                        setFormKey((key) => key + 1);
                        setOpen(false);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors, clearErrors }) => (
                        <>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="caution-name-0">
                                        Caution et propriétaire
                                    </Label>

                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {filledCount} caution(s)
                                    </span>
                                </div>

                                <ScrollArea className="max-h-80">
                                    <div className="space-y-2 pr-3">
                                        {rows.map((row, index) => (
                                            <CautionRowFields
                                                key={row.id}
                                                row={row}
                                                index={index}
                                                owners={owners}
                                                autoFocus={
                                                    index === rows.length - 1
                                                }
                                                canRemove={rows.length > 1}
                                                nameError={
                                                    errors[
                                                        `cautions.${index}.name`
                                                    ]
                                                }
                                                ownerError={
                                                    errors[
                                                        `cautions.${index}.owner_id`
                                                    ] ??
                                                    errors[
                                                        `cautions.${index}.owner_type`
                                                    ]
                                                }
                                                onNameChange={(name) => {
                                                    updateRow(row.id, { name });
                                                }}
                                                onOwnerChange={(
                                                    ownerId,
                                                    ownerType,
                                                ) => {
                                                    updateRow(row.id, {
                                                        ownerId,
                                                        ownerType,
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

                                <InputError message={errors.cautions} />
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
                                pour ajouter une caution, ou collez une colonne
                                entière depuis Excel.
                            </p>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full"
                                >
                                    {processing && <Spinner className="mr-2" />}
                                    Enregistrer {filledCount} caution(s)
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
