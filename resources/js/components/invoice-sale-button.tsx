import { Button } from '@/components/ui/button';
import { computeInvoiceItemRemainingCount } from '@/lib/sales';
import { cn } from '@/lib/utils';
import { InvoiceItem } from '@/types/invoice-item';
import { ShoppingCart } from 'lucide-react';

interface Props {
    /** Purchase invoice line to sell. Absent on the "new row" placeholder. */
    item?: InvoiceItem;
    onOpenSale: (item: InvoiceItem) => void;
}

/** Sell action of an invoice line. */
export function InvoiceItemSaleButton({ item, onOpenSale }: Props) {
    const remaining = computeInvoiceItemRemainingCount(item);

    const isSold = remaining <= 0;

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!item}
            aria-label={`Vendre ${item?.category?.name ?? 'la ligne'}`}
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
    );
}

export default InvoiceItemSaleButton;
