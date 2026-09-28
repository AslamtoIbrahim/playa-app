import { Form } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { bulkStore } from '@/routes/customers';

interface CustomerRow {
    id: number;
    value: string;
}

interface FlashMessage {
    success?: string;
    error?: string;
}

let customerRowId = 0;

function createCustomerRow(value = ''): CustomerRow {
    customerRowId += 1;

    return { id: customerRowId, value };
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

export default function AddCustomerDialog() {
    const [open, setOpen] = useState<boolean>(false);
    const [rows, setRows] = useState<CustomerRow[]>([createCustomerRow()]);
    const [formKey, setFormKey] = useState<number>(0);

    const filledCount = rows.filter((row) => row.value.trim() !== '').length;

    const addRow = () => {
        setRows((current) => [...current, createCustomerRow()]);
    };

    const removeRow = (id: number) => {
        if (rows.length === 1) {
            return;
        }

        setRows((current) => current.filter((row) => row.id !== id));
    };

    const updateRowValue = (id: number, value: string) => {
        setRows((current) =>
            current.map((row) => (row.id === id ? { ...row, value } : row)),
        );
    };

    /**
     * Remplace la ligne collée, puis ajoute une ligne par nom supplémentaire.
     */
    const pasteRows = (index: number, names: string[]) => {
        setRows((current) => {
            const updated = [...current];
            updated[index] = createCustomerRow(names[0]);

            return [
                ...updated,
                ...names.slice(1).map((name) => createCustomerRow(name)),
            ];
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Ajouter des clients</DialogTitle>
                    <DialogDescription>
                        Ajoutez un ou plusieurs noms d&apos;un coup. Les clients
                        déjà existants sont ignorés automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...bulkStore.form()}
                    key={formKey}
                    transform={(data) => {
                        const names =
                            (data.names as string[] | undefined) ?? [];

                        return {
                            names: names.filter((name) => name.trim() !== ''),
                        };
                    }}
                    onBefore={() => {
                        if (filledCount === 0) {
                            toast.error('Ajoutez au moins un nom de client.');

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
                                'Les clients ont été enregistrés ! ✅',
                        );

                        setRows([createCustomerRow()]);
                        setFormKey((key) => key + 1);
                        setOpen(false);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors, clearErrors }) => (
                        <>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="customer-name-0">
                                        Noms des clients
                                    </Label>

                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {filledCount} client(s)
                                    </span>
                                </div>

                                <ScrollArea className="max-h-64">
                                    <div className="space-y-2 pr-3">
                                        {rows.map((row, index) => (
                                            <div
                                                key={row.id}
                                                className="space-y-1"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <Input
                                                        id={`customer-name-${index}`}
                                                        name="names[]"
                                                        defaultValue={row.value}
                                                        autoComplete="off"
                                                        autoFocus={
                                                            index ===
                                                            rows.length - 1
                                                        }
                                                        placeholder={
                                                            index === 0
                                                                ? 'ex: Ahmed Mansouri'
                                                                : 'Autre nom...'
                                                        }
                                                        onChange={(event) => {
                                                            updateRowValue(
                                                                row.id,
                                                                event.target
                                                                    .value,
                                                            );
                                                        }}
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                'Enter'
                                                            ) {
                                                                event.preventDefault();
                                                                addRow();
                                                            }
                                                        }}
                                                        onPaste={(event) => {
                                                            const pasted =
                                                                event.clipboardData.getData(
                                                                    'text',
                                                                );

                                                            if (
                                                                !pasted.includes(
                                                                    '\n',
                                                                )
                                                            ) {
                                                                return;
                                                            }

                                                            const pastedNames =
                                                                splitPastedNames(
                                                                    pasted,
                                                                );

                                                            if (
                                                                pastedNames.length ===
                                                                0
                                                            ) {
                                                                return;
                                                            }

                                                            event.preventDefault();
                                                            clearErrors();
                                                            pasteRows(
                                                                index,
                                                                pastedNames,
                                                            );
                                                        }}
                                                    />

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Supprimer la ligne ${index + 1}`}
                                                        disabled={
                                                            rows.length === 1
                                                        }
                                                        className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                                                        onClick={() => {
                                                            clearErrors();
                                                            removeRow(row.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <InputError
                                                    message={
                                                        errors[`names.${index}`]
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <InputError message={errors.names} />
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
                                pour ajouter un nom, ou collez une colonne
                                entière depuis Excel.
                            </p>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full"
                                >
                                    {processing && <Spinner />}
                                    Enregistrer {filledCount} client(s)
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
