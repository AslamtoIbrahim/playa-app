import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Loader2,
    Pencil,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput as SearchInput,
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
import { cn } from '@/lib/utils';

import { update } from '@/routes/invoices';
import type { Customer } from '@/types/customers';
import type { Invoice } from '@/types/invoice';

interface Props {
    invoice: Invoice;
    customers: Customer[];
    trigger?: React.ReactNode;
}

export default function EditInvoiceDialog({
    invoice,
    customers,
    trigger,
}: Props) {
    const [open, setOpen] = useState(false);
    const [comboOpen, setComboOpen] = useState(false);

    const [selectedCustomerId, setSelectedCustomerId] = useState(
        invoice.customer_id.toString(),
    );
    const [date, setDate] = useState<Date>(parseISO(invoice.date));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase">
                        Modifier la Facture {invoice.invoice_number}
                    </DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations générales de la facture.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(invoice.id)}
                    onSuccess={() => {
                        toast.success('Facture mise à jour ! ✨');
                        setOpen(false);
                    }}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4 pt-4">
                            {/* Hidden Fields */}
                            <input
                                type="hidden"
                                name="customer_id"
                                value={selectedCustomerId}
                            />
                            <input
                                type="hidden"
                                name="date"
                                value={format(date, 'yyyy-MM-dd')}
                            />

                            {/* Customer Selector */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                    Compte / Client
                                </Label>
                                <Popover
                                    open={comboOpen}
                                    onOpenChange={setComboOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between font-medium"
                                        >
                                            {selectedCustomerId
                                                ? customers.find(
                                                      (cust) =>
                                                          cust.id.toString() ===
                                                          selectedCustomerId,
                                                  )?.name
                                                : 'Sélectionner un compte...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <SearchInput placeholder="Rechercher un compte..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    Aucun compte trouvé.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {customers.map((cust) => (
                                                        <CommandItem
                                                            key={cust.id}
                                                            value={cust.name}
                                                            onSelect={() => {
                                                                setSelectedCustomerId(
                                                                    cust.id.toString(),
                                                                );
                                                                setComboOpen(
                                                                    false,
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    selectedCustomerId ===
                                                                        cust.id.toString()
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                            {cust.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.customer_id && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.customer_id}
                                    </p>
                                )}
                            </div>

                            {/* Date Picker */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                    Date de Facturation
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-medium"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? (
                                                format(date, 'dd/MM/yyyy')
                                            ) : (
                                                <span>Choisir une date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => d && setDate(d)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.date && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.date}
                                    </p>
                                )}
                            </div>

                            {/* Calculated Values: Display Only */}
                            <div className="grid grid-cols-2 gap-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Poids Total
                                    </span>
                                    <p className="text-sm font-bold text-slate-700">
                                        {invoice.weight || 0} KG
                                    </p>
                                </div>
                                <div className="space-y-1 border-l border-slate-200 pl-4">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        Montant Total
                                    </span>
                                    <p className="text-sm font-bold text-blue-600">
                                        {invoice.amount} DH
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={processing}
                                    className="font-semibold"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="min-w-[140px] font-bold"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        'Enregistrer'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
