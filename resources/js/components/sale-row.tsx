import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { useSaleRow } from '@/hooks/use-sale-row';
import { formatDifferenceAmount } from '@/lib/differences';
import { computeSaleItemDiff, formatSaleLabel } from '@/lib/sales';
import { cn } from '@/lib/utils';
import { InvoiceItem } from '@/types/invoice-item';
import { Sale } from '@/types/sale';
import { SaleItem } from '@/types/sale-item';
import { Check, Loader2, Trash2 } from 'lucide-react';
import { SearchSelect } from './search-select';

interface RowProps {
    saleItem?: SaleItem;
    invoiceItem: InvoiceItem;
    sales: Sale[];
    maxAvailable: number;
    isNew?: boolean;
    onSuccess?: () => void;
    onDelete?: (id: number) => void;
}

/**
 * Une ligne de vente : choix de la vente cible (client), quantité vendue et
 * prix réel. L'écart est calculé en direct, exactement comme le fera le
 * serveur à l'enregistrement.
 */
export function SaleRow({
    saleItem,
    invoiceItem,
    sales,
    maxAvailable,
    isNew,
    onSuccess,
    onDelete,
}: RowProps) {
    const {
        data,
        handleDataChange,
        loading,
        openSale,
        setOpenSale,
        handleDelete,
        handleKeyDown,
        submitSave,
    } = useSaleRow({
        saleItem,
        invoiceItemId: invoiceItem.id,
        maxAvailable,
        isNew,
        onSuccess,
        onDelete,
    });

    const saleOptions = sales.map((sale) => ({
        id: sale.id,
        name: formatSaleLabel(sale.id, sale.customer?.name),
    }));

    const previewDiff = isNew
        ? computeSaleItemDiff(
              data.unit_count,
              data.real_price,
              invoiceItem.unit_price,
          )
        : Number(saleItem?.total_diff);

    const displayDiff = isNew
        ? data.unit_count !== '' && data.real_price !== ''
        : true;

    const inputClass =
        'h-10 border-none bg-transparent text-center focus-visible:ring-0 focus-visible:bg-slate-100 dark:focus-visible:bg-neutral-800 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-neutral-100';

    return (
        <TableRow
            className={cn(
                'group h-10 min-h-10 border-b border-slate-100 transition-colors dark:border-neutral-800',
                isNew
                    ? 'border-t-2 border-blue-100 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/40'
                    : 'hover:bg-slate-50/50 dark:hover:bg-neutral-900/40',
            )}
        >
            {/* Vente cible (client) */}
            <TableCell
                className={cn(
                    'min-w-44 border-r p-0',
                    isNew
                        ? 'border-blue-100/50 dark:border-blue-900/40'
                        : 'border-slate-100 dark:border-neutral-800',
                )}
            >
                <SearchSelect
                    value={data.sale_id}
                    options={saleOptions}
                    placeholder="Vente..."
                    emptyMessage="Aucune vente pour cette journée."
                    open={openSale}
                    onOpenChange={setOpenSale}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e, 'sale');
                        }
                    }}
                    onSelect={(id) => {
                        {
                            handleDataChange({ sale_id: id.toString() });

                            setOpenSale(false);

                            if (!isNew) {
                                {
                                    submitSave({
                                        ...data,
                                        sale_id: id.toString(),
                                    });
                                }
                            }
                        }
                    }}
                    className="w-full justify-between border-none bg-transparent font-medium text-slate-900 capitalize shadow-none dark:text-neutral-100"
                />
            </TableCell>

            {/* Quantité vendue */}
            <TableCell
                className={cn(
                    'w-20 border-r p-0',
                    isNew
                        ? 'border-blue-100/50 dark:border-blue-900/40'
                        : 'border-slate-100 dark:border-neutral-800',
                )}
            >
                <Input
                    value={data.unit_count}
                    placeholder="0"
                    onChange={(e) => {
                        {
                            handleDataChange({ unit_count: e.target.value });
                        }
                    }}
                    onBlur={() => {
                        {
                            if (!isNew && saleItem) {
                                {
                                    submitSave();
                                }
                            }
                        }
                    }}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e);
                        }
                    }}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            {/* Prix réel */}
            <TableCell
                className={cn(
                    'w-28 border-r p-0',
                    isNew
                        ? 'border-blue-100/50 dark:border-blue-900/40'
                        : 'border-slate-100 dark:border-neutral-800',
                )}
            >
                <Input
                    value={data.real_price}
                    placeholder="0.00"
                    onChange={(e) => {
                        {
                            handleDataChange({ real_price: e.target.value });
                        }
                    }}
                    onBlur={() => {
                        {
                            if (!isNew && saleItem) {
                                {
                                    submitSave();
                                }
                            }
                        }
                    }}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e);
                        }
                    }}
                    className={inputClass}
                    type="number"
                />
            </TableCell>

            {/* Écart réel */}
            <TableCell
                className={cn(
                    'w-28 pr-6 text-right font-bold',
                    isNew
                        ? 'text-slate-300 italic dark:text-neutral-600'
                        : (() => {
                              if (previewDiff < 0) {
                                  {
                                      return 'text-red-500 dark:text-red-400';
                                  }
                              }

                              if (previewDiff > 0) {
                                  {
                                      return 'text-green-600 dark:text-green-400';
                                  }
                              }

                              {
                                  return 'text-slate-600 dark:text-neutral-300';
                              }
                          })(),
                )}
            >
                {displayDiff
                    ? (previewDiff > 0 ? '+' : '') +
                      formatDifferenceAmount(previewDiff)
                    : 'Auto'}
            </TableCell>

            {/* Action */}
            <TableCell className="w-15 min-w-15 p-0 text-center">
                <div
                    className={cn(
                        'flex h-10 items-center justify-center',
                        !isNew && 'opacity-0 group-hover:opacity-100',
                    )}
                >
                    {loading ? (
                        <Loader2
                            className={cn(
                                'h-4 w-4 animate-spin',
                                isNew
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-400 dark:text-neutral-500',
                            )}
                        />
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                {
                                    isNew ? submitSave() : handleDelete();
                                }
                            }}
                            className={cn(
                                'h-10 w-full rounded-none',
                                isNew
                                    ? 'text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950/60'
                                    : 'text-slate-400 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400',
                            )}
                        >
                            {isNew ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

export default SaleRow;
