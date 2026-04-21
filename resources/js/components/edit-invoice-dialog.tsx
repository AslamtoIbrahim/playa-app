import { Form, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    AlertCircle,
    ArrowRight,
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Pencil,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import { update } from '@/routes/invoices';
import type { Invoice, Billable } from '@/types/invoice';

interface Props {
    invoice: Invoice;
    billables: Billable[];
    trigger?: React.ReactNode;
}

export default function EditInvoiceDialog({
    invoice,
    billables,
    trigger,
}: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [comboOpen, setComboOpen] = useState<boolean>(false);

    const [selectedBillable, setSelectedBillable] = useState<Billable | null>(
        billables.find(
            (b) => b.id === invoice.billable_id && b.type === invoice.billable_type
        ) || null
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
                    onError={(e) => {
                        console.log('msg', e)
                    }
                    }
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors, clearErrors }) => {
                        const sessionError = errors.date;

                        if (sessionError && sessionError.includes("session")) {
                            return (
                                <div className="space-y-6 py-4 text-center">
                                    <Alert variant="destructive" className="text-left bg-destructive/5">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="font-bold">Session manquante</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            {sessionError}
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex flex-col gap-2">
                                        <Button asChild variant="default" className="w-full font-bold uppercase">
                                            <Link href="/sessions">
                                                Aller créer une session <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                clearErrors('date');
                                                setDate(new Date());
                                            }}
                                        >
                                            Changer la date
                                        </Button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <>
                                {/* Hidden Fields for Form Submission */}
                                <input
                                    type="hidden"
                                    name="billable_id"
                                    value={selectedBillable?.id || ''}
                                />
                                <input
                                    type="hidden"
                                    name="status"
                                    value={invoice.status}  
                                />
                                <input
                                    type="hidden"
                                    name="billable_type"
                                    value={selectedBillable?.type || ''}
                                />
                                <input
                                    type="hidden"
                                    name="date"
                                    value={date ? format(date, 'yyyy-MM-dd') : ''}
                                />

                                {/* Billable Selector */}
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
                                                {selectedBillable
                                                    ? selectedBillable.name
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
                                                        {billables.map((item) => {
                                                            const isSelected =
                                                                selectedBillable?.id === item.id &&
                                                                selectedBillable?.type === item.type;

                                                            return (
                                                                <CommandItem
                                                                    key={`${item.type}-${item.id}`}
                                                                    value={item.name}
                                                                    onSelect={() => {
                                                                        setSelectedBillable(item);
                                                                        setComboOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'mr-2 h-4 w-4',
                                                                            isSelected ? 'opacity-100' : 'opacity-0'
                                                                        )}
                                                                    />
                                                                    {item.name}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {errors.billable_id && (
                                        <p className="text-sm font-medium text-red-500">
                                            {errors.billable_id}
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
                                                onSelect={(d: Date | undefined) => {
                                                    if (d) {
                                                        setDate(d);
                                                    }
                                                }}
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

                                {/* Read-only Summary */}
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

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setOpen(false)}
                                    >
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing} className="font-bold">
                                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                                        Enregistrer
                                    </Button>
                                </div>
                            </>
                        );
                    }}
                </Form>
            </DialogContent>
        </Dialog>
    );
}