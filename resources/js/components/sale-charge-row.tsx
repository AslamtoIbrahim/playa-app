import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { useSaleChargeRow } from '@/hooks/use-sale-charge-row';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types/customer';
import type { DailySession } from '@/types/daily-session';
import type { Sale } from '@/types/sale';
import type { SaleCharge } from '@/types/sale-charge';
import { Check, Loader2, Trash2 } from 'lucide-react';
import type { FocusEvent } from 'react';
import MissingDialogSale from './missing-dialog-sale';
import { SearchSelect } from './search-select';

interface RowProps {
    saleCharge?: SaleCharge;
    receiptId: number;
    sales: Sale[];
    maxAvailable: number;
    isNew?: boolean;
    excludedSaleIds?: number[];
    onSuccess?: () => void;
    onDelete?: (id: number) => void;
    onSilentSave?: () => void;
    session?: DailySession | null;
    customers?: Customer[];
}

export function SaleChargeRow({
    saleCharge,
    receiptId,
    sales,
    maxAvailable,
    isNew,
    excludedSaleIds = [],
    onSuccess,
    onDelete,
    onSilentSave,
    session = null,
    customers = [],
}: RowProps) {
    const row = useSaleChargeRow({
        saleCharge,
        receiptId,
        maxAvailable,
        isNew,
        onSuccess,
        onDelete,
        onSilentSave,
    });

    const saleOptions = sales
        .filter((sale) => {
            if (isNew && excludedSaleIds.includes(sale.id)) {
                return false;
            }

            return true;
        })
        .map((sale) => ({
            id: sale.id,
            name: sale.customer?.name || 'Client Inconnu',
        }));

    const canCreateSale = session !== null && customers.length > 0;
    const createSaleSession = canCreateSale ? session : null;

    const { data, handleDataChange, loading, openSale, setOpenSale } = row;
    const { handleDelete, handleKeyDown, submitSave } = row;

    const inputClass = 'h-10 border-none bg-transparent text-center';

    const handleInputFocus = (e: FocusEvent<HTMLInputElement>): void => {
        {
            if (isNew) {
                {
                    e.target.select();
                }
            }
        }
    };

    return (
        <TableRow className="group h-10 border-b border-slate-100 dark:border-neutral-800">
            <TableCell className="min-w-44 border-r p-0">
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
                    renderNoMatchAction={
                        createSaleSession !== null
                            ? (search) => (
                                  <MissingDialogSale
                                      sessionId={createSaleSession.id}
                                      sessionDate={
                                          createSaleSession.session_date
                                      }
                                      customers={customers}
                                      initialCustomerName={search}
                                  />
                              )
                            : undefined
                    }
                    onSelect={(id) => {
                        {
                            handleDataChange({ sale_id: id.toString() });

                            setOpenSale(false);

                            if (!isNew) {
                                {
                                    submitSave(
                                        { ...data, sale_id: id.toString() },
                                        { silent: true },
                                    );
                                }
                            }
                        }
                    }}
                    className="bg-transparent shadow-none"
                />
            </TableCell>
            <TableCell className="w-32 border-r p-0">
                <Input
                    value={data.amount}
                    placeholder="0.00"
                    onFocus={handleInputFocus}
                    onChange={(e) => {
                        {
                            handleDataChange({ amount: e.target.value });
                        }
                    }}
                    onBlur={() => {
                        {
                            if (!isNew && saleCharge) {
                                {
                                    submitSave(undefined, { silent: true });
                                }
                            }
                        }
                    }}
                    onKeyDown={(e) => {
                        {
                            handleKeyDown(e);
                        }
                    }}
                    className={cn(
                        inputClass,
                        'text-slate-900 dark:text-neutral-100',
                    )}
                    type="number"
                />
            </TableCell>

            <TableCell className="w-40 pr-4 text-right text-xs text-slate-400 dark:text-neutral-500">
                {`Max ${Number(maxAvailable).toLocaleString('fr-FR')} DH`}
            </TableCell>

            <TableCell className="w-15 p-0 text-center">
                <div
                    className={cn(
                        'flex h-10 items-center justify-center',
                        !isNew && 'opacity-0 group-hover:opacity-100',
                    )}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                {
                                    isNew ? submitSave() : handleDelete();
                                }
                            }}
                            onKeyDown={(e) => {
                                {
                                    navigateToAdjacentCell(e);
                                }
                            }}
                            className="h-10 w-full rounded-none"
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

export default SaleChargeRow;
