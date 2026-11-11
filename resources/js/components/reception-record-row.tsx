import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { useReceptionRecord } from '@/hooks/use-reception-record';
import { formatDateDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { ReceptionRecord } from '@/types/reception-record';
import { Loader2 } from 'lucide-react';

interface Props {
    usineId: number;
    record: ReceptionRecord;
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

const inputClassName =
    'h-9 w-full min-w-0 rounded-none border-none bg-transparent px-1 text-center text-sm font-semibold tabular-nums text-slate-900 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-inset focus-visible:ring-offset-0 dark:text-neutral-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export default function ReceptionRecordRow({ usineId, record }: Props) {
    const { data, loading, handleDataChange, handleBlur, handleKeyDown } =
        useReceptionRecord({ usineId, record });

    const weight = Number(data.weight) || 0;
    const amount = Number(data.amount) || 0;
    const margin = Number(data.margin_percentage) || 0;

    return (
        <TableRow
            onKeyDown={handleKeyDown}
            className="border-b border-slate-100 text-center font-semibold transition-colors hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-800/70"
        >
            <TableCell className="whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                    {formatDateDisplay(record.session_date)}
                    {loading && (
                        <Loader2
                            aria-label="Enregistrement en cours"
                            className="h-3 w-3 animate-spin text-muted-foreground"
                        />
                    )}
                </div>
            </TableCell>
            <TableCell className="p-0">
                <Input
                    aria-label="Réception"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.weight}
                    onChange={(event) =>
                        handleDataChange({ weight: event.target.value })
                    }
                    onBlur={handleBlur}
                />
            </TableCell>
            <TableCell className="text-xs font-bold uppercase">
                {record.designation}
            </TableCell>
            <TableCell className="text-xs uppercase">
                {record.origin || '—'}
            </TableCell>
            <TableCell className="p-0">
                <Input
                    aria-label="TTC"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.ttc}
                    onChange={(event) =>
                        handleDataChange({ ttc: event.target.value })
                    }
                    onBlur={handleBlur}
                />
            </TableCell>
            <TableCell className="text-right text-sm font-medium tabular-nums">
                {formatNumber(weight > 0 ? amount / weight : 0)}
            </TableCell>
            <TableCell className="p-0">
                <Input
                    aria-label="Valeur d'achat"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.amount}
                    onChange={(event) =>
                        handleDataChange({ amount: event.target.value })
                    }
                    onBlur={handleBlur}
                />
            </TableCell>
            <TableCell className="p-0">
                <Input
                    aria-label="Pourcentage"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.margin_percentage}
                    onChange={(event) =>
                        handleDataChange({
                            margin_percentage: event.target.value,
                        })
                    }
                    onBlur={handleBlur}
                />
            </TableCell>
            <TableCell className="text-right text-sm font-semibold tabular-nums">
                {formatNumber(amount + weight * margin)}
            </TableCell>
            <TableCell className="p-0 text-center">
                <button
                    type="button"
                    aria-label={
                        data.is_invoiced
                            ? 'Marquer la réception comme non facturée'
                            : 'Marquer la réception comme facturée'
                    }
                    aria-pressed={data.is_invoiced}
                    onClick={() =>
                        handleDataChange({ is_invoiced: !data.is_invoiced })
                    }
                    className={cn(
                        'h-9 w-full text-xs font-bold transition-colors hover:bg-slate-100 dark:hover:bg-neutral-800/70',
                        data.is_invoiced
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400',
                    )}
                >
                    {data.is_invoiced ? 'V' : 'F'}
                </button>
            </TableCell>
            <TableCell className="p-0">
                <Input
                    aria-label="Bon de réception"
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="1"
                    value={data.invoice_reference}
                    onChange={(event) =>
                        handleDataChange({
                            invoice_reference: event.target.value,
                        })
                    }
                    onBlur={handleBlur}
                />
            </TableCell>
        </TableRow>
    );
}
