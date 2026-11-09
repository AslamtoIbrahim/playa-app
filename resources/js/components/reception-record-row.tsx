import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import { destroy, update } from '@/routes/usines/reception-records';
import type { ReceptionRecord } from '@/types/reception-record';
import { router } from '@inertiajs/react';
import { Check, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    usineId: number;
    record: ReceptionRecord;
}

interface FormValues {
    session_id: string;
    weight: string;
    ttc: string;
    amount: string;
    margin_percentage: string;
    invoice_reference: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

function toFixedDecimal(value: string | number): string {
    const parsed = Number(String(value).replace(',', '.'));

    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function ReceptionRecordRow({ usineId, record }: Props) {
    const [form, setForm] = useState<FormValues>(() => ({
        session_id: String(record.session_id),
        weight: toFixedDecimal(record.weight),
        ttc: toFixedDecimal(record.ttc),
        amount: toFixedDecimal(record.amount),
        margin_percentage: toFixedDecimal(record.margin_percentage),
        invoice_reference: record.invoice_reference
            ? String(record.invoice_reference)
            : '',
    }));
    const [errors, setErrors] = useState<FormErrors>({});
    const [processing, setProcessing] = useState(false);

    const weight = Number(form.weight) || 0;
    const amount = Number(form.amount) || 0;
    const margin = Number(form.margin_percentage) || 0;
    const isDirty =
        form.weight !== toFixedDecimal(record.weight) ||
        form.ttc !== toFixedDecimal(record.ttc) ||
        form.amount !== toFixedDecimal(record.amount) ||
        form.margin_percentage !== toFixedDecimal(record.margin_percentage) ||
        form.invoice_reference !==
            (record.invoice_reference ? String(record.invoice_reference) : '');

    const updateField = (field: keyof FormValues, value: string) => {
        setForm((current) => {
            return { ...current, [field]: value };
        });
    };

    const normalizeDecimal = (field: keyof FormValues) => {
        if (field !== 'invoice_reference' && field !== 'session_id') {
            updateField(field, toFixedDecimal(form[field]));
        }
    };

    const save = () => {
        setProcessing(true);
        setErrors({});

        router.patch(
            update({
                usine: usineId,
                receptionRecord: record.id,
            }).url,
            {
                ...form,
                invoice_reference: form.invoice_reference || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Réception mise à jour avec succès.');
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors as FormErrors);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const remove = () => {
        if (!window.confirm('Supprimer cette réception ?')) {
            return;
        }

        router.delete(
            destroy({
                usine: usineId,
                receptionRecord: record.id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Réception supprimée.'),
                onError: () =>
                    toast.error('Impossible de supprimer cette réception.'),
            },
        );
    };

    const inputClassName =
        'h-10 min-w-20 rounded-none border-none bg-transparent text-center text-xs shadow-none focus-visible:ring-1 focus-visible:ring-blue-500';

    return (
        <TableRow className="group border-b border-slate-100 text-center font-semibold transition-colors hover:bg-blue-50/40 dark:border-neutral-800 dark:hover:bg-blue-950/20">
            <TableCell className="whitespace-nowrap">
                {formatDateDisplay(record.session_date)}
            </TableCell>
            <TableCell>
                <Input
                    aria-label="Réception"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.weight}
                    onChange={(event) =>
                        updateField('weight', event.target.value)
                    }
                    onBlur={() => normalizeDecimal('weight')}
                    aria-invalid={Boolean(errors.weight)}
                    title={errors.weight}
                />
                <InputError message={errors.weight} />
            </TableCell>
            <TableCell className="text-xs font-bold uppercase">
                {record.designation}
            </TableCell>
            <TableCell className="text-xs">{record.origin || '—'}</TableCell>
            <TableCell>
                <Input
                    aria-label="TTC"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.ttc}
                    onChange={(event) => updateField('ttc', event.target.value)}
                    onBlur={() => normalizeDecimal('ttc')}
                    aria-invalid={Boolean(errors.ttc)}
                    title={errors.ttc}
                />
                <InputError message={errors.ttc} />
            </TableCell>
            <TableCell className="bg-slate-50/40 text-right text-xs font-medium dark:bg-neutral-900/40">
                {formatNumber(weight > 0 ? amount / weight : 0)}
            </TableCell>
            <TableCell>
                <Input
                    aria-label="Valeur d'achat"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                        updateField('amount', event.target.value)
                    }
                    onBlur={() => normalizeDecimal('amount')}
                    aria-invalid={Boolean(errors.amount)}
                    title={errors.amount}
                />
                <InputError message={errors.amount} />
            </TableCell>
            <TableCell>
                <Input
                    aria-label="Pourcentage"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.margin_percentage}
                    onChange={(event) =>
                        updateField('margin_percentage', event.target.value)
                    }
                    onBlur={() => normalizeDecimal('margin_percentage')}
                    aria-invalid={Boolean(errors.margin_percentage)}
                    title={errors.margin_percentage}
                />
                <InputError message={errors.margin_percentage} />
            </TableCell>
            <TableCell className="bg-slate-50/40 text-right text-xs font-semibold dark:bg-neutral-900/40">
                {formatNumber(amount + weight * margin)}
            </TableCell>
            <TableCell
                className={
                    record.is_invoiced
                        ? 'font-bold text-green-600'
                        : 'font-bold text-red-600'
                }
            >
                {record.is_invoiced ? 'V' : 'F'}
            </TableCell>
            <TableCell>
                <Input
                    aria-label="Bon de réception"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="1"
                    value={form.invoice_reference}
                    onChange={(event) =>
                        updateField('invoice_reference', event.target.value)
                    }
                    aria-invalid={Boolean(errors.invoice_reference)}
                    title={errors.invoice_reference}
                />
                <InputError message={errors.invoice_reference} />
            </TableCell>
            <TableCell>
                <div className="flex justify-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Enregistrer la réception"
                        disabled={processing || !isDirty}
                        onClick={save}
                        className="h-8 w-8 text-green-600 opacity-60 transition-opacity group-hover:opacity-100 disabled:opacity-25"
                    >
                        {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Supprimer la réception"
                        onClick={remove}
                        className="h-8 w-8 text-red-500 opacity-60 transition-opacity group-hover:opacity-100"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
