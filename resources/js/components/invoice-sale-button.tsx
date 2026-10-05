import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    computeInvoiceItemRemainingCount,
    computeInvoiceItemSoldCount,
} from '@/lib/sales';
import { cn } from '@/lib/utils';
import { InvoiceItem } from '@/types/invoice-item';
import { ShoppingCart } from 'lucide-react';

interface Props {
    /** Purchase invoice line to sell. Absent on the "new row" placeholder. */
    item?: InvoiceItem;
    onOpenSale: (item: InvoiceItem) => void;
}

const arrowClass =
    'bg-white fill-white dark:bg-neutral-900 dark:fill-neutral-900';

/** Unit label, pluralized according to the quantity it qualifies. */
function formatUnit(quantity: number, unit?: string): string {
    if (unit === 'kg') {
        return 'kg';
    }

    return quantity > 1 ? 'caisses' : 'caisse';
}

/**
 * Sell action of an invoice line: opens the sale dialog on click and shows,
 * as soon as the pointer hovers the icon, how much of the line is still
 * unsold.
 *
 * The hint reuses the very same helpers as the dialog, so the quantity read in
 * the table and the one read inside the dialog can never disagree: it is
 * refreshed through the Inertia props after every sale.
 */
export function InvoiceItemSaleButton({ item, onOpenSale }: Props) {
    const sold = computeInvoiceItemSoldCount(item);
    const remaining = computeInvoiceItemRemainingCount(item);
    const total = Number(item?.unit_count) || 0;

    const isSold = remaining <= 0;
    const hasSales = sold > 0;

    const hintTone =
        remaining < 0
            ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
            : isSold
              ? 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
              : 'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400';

    const hintStatus =
        remaining < 0
            ? `Trop vendu : ${Math.abs(remaining)} ${formatUnit(Math.abs(remaining), item?.unit)}`
            : isSold
              ? 'Terminé'
              : `Reste : ${remaining} ${formatUnit(remaining, item?.unit)}`;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!item}
                    aria-label={`Vendre ${item?.item?.name ?? 'la ligne'}`}
                    onClick={() => {
                        if (item) {
                            {
                                onOpenSale(item);
                            }
                        }
                    }}
                    className={cn(
                        'h-10 w-full rounded-none transition-colors',
                        !item &&
                            'cursor-not-allowed text-slate-300 dark:text-neutral-700',
                        item &&
                            'cursor-pointer hover:bg-emerald-50 focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-emerald-950/40 dark:focus-visible:ring-neutral-700',
                        item &&
                            isSold &&
                            'text-emerald-600 dark:text-emerald-400',
                        item &&
                            !isSold &&
                            'text-slate-300 hover:text-emerald-600 dark:text-neutral-600 dark:hover:text-emerald-400',
                    )}
                >
                    <ShoppingCart className="h-4 w-4" />
                </Button>
            </TooltipTrigger>

            <TooltipContent
                side="top"
                align="center"
                className={cn(
                    'border bg-white font-medium shadow-lg dark:bg-neutral-900',
                    hintTone,
                )}
                arrowClassName={arrowClass}
            >
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black">{hintStatus}</span>

                    {hasSales && (
                        <span className="text-[10px] opacity-80">
                            Vendu : {sold} / {total}{' '}
                            {formatUnit(total, item?.unit)}
                        </span>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

export default InvoiceItemSaleButton;
