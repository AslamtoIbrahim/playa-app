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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn, commandItemClass } from '@/lib/utils';
import { store as saleStore } from '@/routes/sales';
import type { Customer } from '@/types/customer';
import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type MissingDialogSaleProps = {
    /** Daily session that will own the created sale. */
    sessionId: number;
    /** Session date (ISO or `yyyy-MM-dd`), reused as the sale date. */
    sessionDate: string;
    /** Customers offered to start the sale from. */
    customers: Customer[];
};

/**
 * Converts an ISO datetime (`2026-09-21T00:00:00.000000Z`) into `yyyy-MM-dd`
 * without going through the browser timezone.
 */
const toInputDate = (value: string): string => value.split('T')[0];

/**
 * Creates the sale missing from the current session, from inside the sale
 * distribution dialog. The session and its date are already known: only the
 * customer has to be picked. Reuses `sales.store` with `redirect=back` so the
 * caller page reloads its `sales` list and the new sale becomes selectable
 * without leaving the dialog context.
 */
export default function MissingDialogSale({
    sessionId,
    sessionDate,
    customers,
}: MissingDialogSaleProps) {
    const [open, setOpen] = useState(false);
    const [customerId, setCustomerId] = useState('');
    const [clientOpen, setClientOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    const selectedCustomer = customers.find(
        (customer) => customer.id.toString() === customerId,
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (nextOpen) {
                    setCustomerId('');
                    setClientSearch('');
                    setClientOpen(false);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Ajouter une vente"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md overflow-hidden sm:max-w-md dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
                <DialogHeader>
                    <DialogTitle>Ajouter une vente</DialogTitle>
                    <DialogDescription>
                        Cette journée n&apos;a pas encore de vente. Sélectionnez
                        le client pour la créer.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...saleStore.form()}
                    onBefore={() => {
                        if (customerId === '') {
                            toast.error('Veuillez choisir un client.');

                            return false;
                        }

                        return true;
                    }}
                    onSuccess={() => {
                        toast.success('Vente créée avec succès !');
                        setOpen(false);
                    }}
                    onError={(errors) => {
                        const firstError = Object.values(errors)[0];

                        if (firstError) {
                            toast.error(firstError);
                        }
                    }}
                    className="w-full min-w-0 space-y-4 pt-2"
                >
                    <input
                        type="hidden"
                        name="customer_id"
                        value={customerId}
                    />
                    <input type="hidden" name="session_id" value={sessionId} />
                    <input
                        type="hidden"
                        name="date"
                        value={toInputDate(sessionDate)}
                    />
                    <input type="hidden" name="type" value="normal" />
                    {/* Stay on the caller page instead of the sale sheet. */}
                    <input type="hidden" name="redirect" value="back" />

                    <Popover open={clientOpen} onOpenChange={setClientOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    'w-full justify-between font-normal',
                                    !customerId && 'text-muted-foreground',
                                )}
                            >
                                <span className="truncate">
                                    {selectedCustomer?.name ??
                                        'Choisir un client...'}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent
                            className="w-(--radix-popover-trigger-width) p-0"
                            align="start"
                        >
                            <Command>
                                <CommandInput
                                    placeholder="Rechercher..."
                                    value={clientSearch}
                                    onValueChange={setClientSearch}
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        Aucun client trouvé.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {customers.map((customer) => (
                                            <CommandItem
                                                className={commandItemClass}
                                                key={customer.id}
                                                value={customer.name}
                                                onSelect={() => {
                                                    setCustomerId(
                                                        customer.id.toString(),
                                                    );
                                                    setClientOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        customerId ===
                                                            customer.id.toString()
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                                {customer.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <DialogFooter className="w-full min-w-0 pt-2">
                        <Button type="submit" className="w-full min-w-0">
                            Ajouter la vente
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
