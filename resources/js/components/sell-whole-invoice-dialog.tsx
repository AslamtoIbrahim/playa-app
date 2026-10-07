import { Form } from '@inertiajs/react';
import {
    Banknote,
    Check,
    ChevronsUpDown,
    Package,
    Scale,
    ShoppingCart,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { computeInvoiceRemainingTotals } from '@/lib/sales';
import { cn, commandItemClass } from '@/lib/utils';
import { sell } from '@/routes/invoices';
import type { Customer } from '@/types/customer';
import type { Invoice } from '@/types/invoice';

/** Flash messages shared with the frontend by the backend middleware. */
interface FlashMessage {
    success?: string | null;
    error?: string | null;
}

export interface SellWholeInvoiceDialogProps {
    invoice: Invoice;
    /** Clients déjà utilisés par les ventes de la journée. */
    customers: Customer[];
    formatCurrency: (amount: number) => string;
    trigger?: ReactNode;
}

/**
 * Sells the unsold remainder of a purchase invoice to a single customer.
 *
 * The dialog displays the totals of the remaining quantity only (amount /
 * weight / boxes): lines or quantities already distributed to sales are
 * excluded. The backend enforces the same rule and refuses an invoice that is
 * already fully sold.
 */
export default function SellWholeInvoiceDialog({
    invoice,
    customers,
    formatCurrency,
    trigger,
}: SellWholeInvoiceDialogProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [clientComboOpen, setClientComboOpen] = useState<boolean>(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

    // Totals of the quantity still sellable: already-sold lines are excluded.
    const remaining = computeInvoiceRemainingTotals(invoice);
    const hasRemaining = remaining.hasRemaining;

    const hasCustomers = customers.length > 0;

    const selectedCustomer =
        customers.find(
            (customer) => customer.id.toString() === selectedCustomerId,
        ) ?? null;

    const handleOpenChange = (nextOpen: boolean): void => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setSelectedCustomerId('');
            setClientComboOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Vendre le reste de la facture"
                        title="Vendre le reste de la facture"
                        className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                    >
                        {/* <HandCoins className="h-4 w-4" /> */}
                        <ShoppingCart className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-112.5">
                <DialogHeader>
                    <DialogTitle className="font-black text-slate-900 uppercase dark:text-neutral-100">
                        Vendre le reste de la facture
                    </DialogTitle>

                    <DialogDescription>
                        Choisissez le client vendeur : seul le reste non vendu
                        sera vendu, au prix facturé. Les quantités déjà vendues
                        à d'autres clients sont exclues.
                    </DialogDescription>
                </DialogHeader>

                {/* Totaux du reste non vendu : montant, poids et caisses. */}
                <div className="space-y-2 pt-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                        Reste à vendre
                    </span>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-neutral-700 dark:bg-neutral-800/60">
                            <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                <Banknote className="h-3.5 w-3.5" /> Montant
                            </span>

                            <p className="mt-1 text-sm font-black text-slate-900 dark:text-neutral-100">
                                {formatCurrency(remaining.amount)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-neutral-700 dark:bg-neutral-800/60">
                            <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                <Scale className="h-3.5 w-3.5" /> Poids Kg
                            </span>

                            <p className="mt-1 text-sm font-black text-slate-900 dark:text-neutral-100">
                                {remaining.weight}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-neutral-700 dark:bg-neutral-800/60">
                            <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                                <Package className="h-3.5 w-3.5" /> Caisses
                            </span>

                            <p className="mt-1 text-sm font-black text-slate-900 dark:text-neutral-100">
                                {remaining.boxes}
                            </p>
                        </div>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-neutral-400">
                        Seules les lignes non vendues partent au client choisi,
                        au prix facturé.
                    </p>

                    {!hasRemaining && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                            Facture déjà entièrement vendue : aucun article
                            restant à vendre.
                        </div>
                    )}
                </div>

                <Form
                    {...sell.form(invoice.id)}
                    onSuccess={(page) => {
                        const flash = page.props.flash as
                            | FlashMessage
                            | undefined;

                        if (flash?.error) {
                            toast.error(flash.error, { duration: 6000 });

                            return;
                        }

                        toast.success(
                            flash?.success ??
                                'Reste de la facture vendu avec succès ! ✅',
                        );
                        handleOpenChange(false);
                    }}
                    className="space-y-4 pt-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="customer_id"
                                value={selectedCustomerId}
                            />

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client vendeur
                                </Label>

                                {hasCustomers ? (
                                    <Popover
                                        open={clientComboOpen}
                                        onOpenChange={setClientComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={clientComboOpen}
                                                className={cn(
                                                    'w-full justify-between font-medium dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
                                                    !selectedCustomer &&
                                                        'text-slate-400 dark:text-neutral-500',
                                                )}
                                            >
                                                {selectedCustomer?.name ??
                                                    'Choisir un client...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            className="w-full p-0"
                                            align="start"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Rechercher un client..." />

                                                <CommandList>
                                                    <CommandEmpty>
                                                        Aucun client trouvé.
                                                    </CommandEmpty>

                                                    <CommandGroup>
                                                        {customers.map(
                                                            (customer) => (
                                                                <CommandItem
                                                                    key={
                                                                        customer.id
                                                                    }
                                                                    value={
                                                                        customer.name
                                                                    }
                                                                    className={
                                                                        commandItemClass
                                                                    }
                                                                    onSelect={() => {
                                                                        setSelectedCustomerId(
                                                                            customer.id.toString(),
                                                                        );
                                                                        setClientComboOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'mr-2 h-4 w-4',
                                                                            selectedCustomerId ===
                                                                                customer.id.toString()
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                    {
                                                                        customer.name
                                                                    }
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                                        Aucune vente créée pour cette journée :
                                        créez d'abord une vente dans l'onglet «
                                        Ventes », puis revenez vendre la
                                        facture.
                                    </div>
                                )}

                                <InputError message={errors.customer_id} />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        !hasRemaining ||
                                        !hasCustomers ||
                                        !selectedCustomerId
                                    }
                                    className="w-full font-bold tracking-wider uppercase"
                                >
                                    {processing && (
                                        <Spinner className="mr-2 h-4 w-4" />
                                    )}
                                    Vendre le reste
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
