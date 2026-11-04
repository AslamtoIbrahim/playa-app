import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { computeReceiptRemainingAmount } from '@/lib/sales';
import { cn, commandItemClass } from '@/lib/utils';
import { sellAll } from '@/routes/receipts';
import type { Receipt } from '@/types/receipt';
import type { DailySession } from '@/types/daily-session';
import type { SaleOwnerOption } from '@/types/sale';

interface Props {
    receipts: Receipt[];
    session: DailySession | null;
    owners: SaleOwnerOption[];
    formatCurrency: (amount: number) => string;
}

interface FlashMessage {
    success?: string | null;
    error?: string | null;
}

export default function SellWholeReceiptsDialog({
    receipts,
    session,
    owners,
    formatCurrency,
}: Props) {
    const [open, setOpen] = useState(false);
    const [ownerComboOpen, setOwnerComboOpen] = useState(false);
    const [selectedOwnerKey, setSelectedOwnerKey] = useState('');

    const sellableReceipts = receipts.filter(
        (receipt) => computeReceiptRemainingAmount(receipt) > 0.005,
    );
    const remainingTotal = sellableReceipts.reduce(
        (total, receipt) => total + computeReceiptRemainingAmount(receipt),
        0,
    );
    const selectedOwner = owners.find(
        (owner) => `${owner.type}:${owner.id}` === selectedOwnerKey,
    );

    const handleOpenChange = (nextOpen: boolean): void => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setSelectedOwnerKey('');
            setOwnerComboOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Vendre tous les bons"
                    title="Vendre tous les bons"
                    disabled={!session || sellableReceipts.length === 0}
                    className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                >
                    <ShoppingCart className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-black text-slate-900 uppercase dark:text-neutral-100">
                        Vendre tous les bons
                    </DialogTitle>
                    <DialogDescription>
                        Le reste non vendu de chaque bon sera imputé à une seule
                        vente client ou usine.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/60">
                    <p className="text-[10px] font-bold text-slate-500 uppercase dark:text-neutral-400">
                        {sellableReceipts.length} bon(s) à vendre
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-neutral-100">
                        {formatCurrency(remainingTotal)}
                    </p>
                </div>

                <Form
                    {...sellAll.form()}
                    onSuccess={(page) => {
                        const flash = page.props.flash as
                            | FlashMessage
                            | undefined;

                        if (flash?.error) {
                            toast.error(flash.error, { duration: 6000 });

                            return;
                        }

                        toast.success(
                            flash?.success ?? 'Bons vendus avec succès !',
                        );
                        handleOpenChange(false);
                    }}
                    onError={(errors) => {
                        const firstError = Object.values(errors)[0];

                        if (firstError) {
                            toast.error(firstError);
                        }
                    }}
                    className="space-y-4 pt-2"
                >
                    {({ processing }) => (
                        <>
                            {session && (
                                <input
                                    type="hidden"
                                    name="session_id"
                                    value={session.id}
                                />
                            )}
                            {selectedOwner && (
                                <>
                                    <input
                                        type="hidden"
                                        name="owner_id"
                                        value={selectedOwner.id}
                                    />
                                    <input
                                        type="hidden"
                                        name="type"
                                        value={selectedOwner.type}
                                    />
                                </>
                            )}

                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase dark:text-neutral-400">
                                    Client / usine vendeur
                                </label>
                                {owners.length > 0 ? (
                                    <Popover
                                        open={ownerComboOpen}
                                        onOpenChange={setOwnerComboOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={ownerComboOpen}
                                                className={cn(
                                                    'w-full justify-between font-medium dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
                                                    !selectedOwner &&
                                                        'text-slate-400 dark:text-neutral-500',
                                                )}
                                            >
                                                {selectedOwner?.name ??
                                                    'Choisir un client ou une usine...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-full p-0"
                                            align="start"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Rechercher..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        Aucun client ou usine
                                                        trouvé.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {owners.map((owner) => {
                                                            const key = `${owner.type}:${owner.id}`;

                                                            return (
                                                                <CommandItem
                                                                    key={key}
                                                                    value={
                                                                        owner.name
                                                                    }
                                                                    className={
                                                                        commandItemClass
                                                                    }
                                                                    onSelect={() => {
                                                                        setSelectedOwnerKey(
                                                                            key,
                                                                        );
                                                                        setOwnerComboOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'mr-2 h-4 w-4',
                                                                            selectedOwnerKey ===
                                                                                key
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                    {owner.name}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                                        Aucune vente client ou usine n&apos;a
                                        encore été créée pour cette journée.
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    !session ||
                                    sellableReceipts.length === 0 ||
                                    !selectedOwner
                                }
                                className="w-full font-bold tracking-wider uppercase"
                            >
                                {processing
                                    ? 'Vente en cours...'
                                    : 'Vendre tous les bons'}
                            </Button>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
