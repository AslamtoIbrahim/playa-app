import { Form } from '@inertiajs/react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
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
import { bulkStore } from '@/routes/workers';

interface WorkerRow {
    id: number;
    value: string;
}

interface FlashMessage {
    success?: string;
    error?: string;
}

let workerRowId = 0;

function createWorkerRow(value = ''): WorkerRow {
    workerRowId += 1;

    return { id: workerRowId, value };
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

export default function AddWorkerDialog() {
    const [open, setOpen] = useState<boolean>(false);
    const [rows, setRows] = useState<WorkerRow[]>([createWorkerRow()]);
    const [formKey, setFormKey] = useState<number>(0);

    const filledCount = rows.filter((row) => row.value.trim() !== '').length;

    const addRow = () => {
        setRows((current) => [...current, createWorkerRow()]);
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
            updated[index] = createWorkerRow(names[0]);

            return [
                ...updated,
                ...names.slice(1).map((name) => createWorkerRow(name)),
            ];
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un ouvrier
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-white text-neutral-900 sm:max-w-106.25 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-neutral-100 dark:bg-neutral-800 dark:text-neutral-50">
                            <UserPlus className="h-4 w-4" />
                        </div>
                        <DialogTitle className="text-neutral-900 dark:text-neutral-100">
                            Ajouter des ouvriers
                        </DialogTitle>
                    </div>

                    <DialogDescription className="pt-1 text-neutral-600 dark:text-neutral-400">
                        Ajoutez un ou plusieurs ouvriers d&apos;un coup. Les
                        ouvriers déjà existants sont ignorés automatiquement.
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
                            toast.error("Ajoutez au moins un nom d'ouvrier.");

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
                                'Les ouvriers ont été enregistrés ! ✅',
                        );

                        setRows([createWorkerRow()]);
                        setFormKey((key) => key + 1);
                        setOpen(false);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors, clearErrors }) => (
                        <>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Label
                                        htmlFor="worker-name-0"
                                        className="text-xs tracking-widest text-neutral-500 uppercase"
                                    >
                                        Noms des ouvriers
                                    </Label>

                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {filledCount} ouvrier(s)
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
                                                        id={`worker-name-${index}`}
                                                        name="names[]"
                                                        defaultValue={row.value}
                                                        autoComplete="off"
                                                        autoFocus={
                                                            index ===
                                                            rows.length - 1
                                                        }
                                                        placeholder={
                                                            index === 0
                                                                ? 'ex: Mohammed Alami'
                                                                : 'Autre nom...'
                                                        }
                                                        className="h-11 focus-visible:ring-neutral-400"
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
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                    }}
                                    disabled={processing}
                                >
                                    Annuler
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="min-w-35 bg-neutral-900 text-white! hover:bg-neutral-800 dark:bg-neutral-800 dark:!text-white dark:hover:bg-neutral-700"
                                >
                                    {processing && (
                                        <Spinner className="mr-2 h-4 w-4 text-white! dark:!text-white" />
                                    )}
                                    Enregistrer {filledCount} ouvrier(s)
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
