import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Statistics {
    primary: number;
    numeric: boolean;
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
    countNumbers: number;
}

interface Props {
    statistics: Statistics | null;
}

const format = (value: number | null) =>
    value === null
        ? '—'
        : value.toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

export function InvoiceSelectionStatistics({ statistics }: Props) {
    const [open, setOpen] = useState(false);

    if (!statistics) {
        return null;
    }

    const entries = [
        ['Somme', format(statistics.sum)],
        ['Moyenne', format(statistics.average)],
        ['Minimum', format(statistics.minimum)],
        ['Maximum', format(statistics.maximum)],
        ['Nombre', String(statistics.count)],
    ];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    data-invoice-selection-statistics
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 rounded-md px-2 text-xs font-medium"
                    aria-label="Statistiques de la sélection"
                >
                    {statistics.numeric ? 'Somme' : 'Nombre'}:{' '}
                    {statistics.numeric
                        ? format(statistics.primary)
                        : statistics.primary}
                    {open ? (
                        <ChevronUp className="size-3.5" />
                    ) : (
                        <ChevronDown className="size-3.5" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-52 p-1"
                data-invoice-selection-statistics
            >
                <div className="space-y-0.5">
                    {entries.map(([label, value]) => (
                        <div
                            key={label}
                            className="flex items-center justify-between rounded-sm px-2 py-1.5 text-xs"
                        >
                            <span className="text-muted-foreground">
                                {label}
                            </span>
                            <span className="font-medium tabular-nums">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
