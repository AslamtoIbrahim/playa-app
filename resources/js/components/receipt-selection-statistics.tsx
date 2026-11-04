import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Statistics {
    sum: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    count: number;
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

export function ReceiptSelectionStatistics({ statistics }: Props) {
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
                    data-receipt-selection-statistics
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 rounded-md px-3 text-xs font-medium"
                    aria-label="Statistiques de la sélection"
                >
                    Somme : {format(statistics.sum)}
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
                data-receipt-selection-statistics
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
