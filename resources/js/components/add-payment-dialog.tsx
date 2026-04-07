import { Form } from '@inertiajs/react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Banknote } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Spinner } from '@/components/ui/spinner';
import { cn } from "@/lib/utils";
import { store } from '@/routes/payments'; // تأكد بلي الـ store معرف فـ routes/payments
import type { Facture } from '@/types/factures';
import { Calendar } from './ui/calendar';

interface Props {
    facture: Facture;
}

export default function AddPaymentDialog({ facture }: Props) {
    const [open, setOpen] = useState(false);
    
    // States for custom inputs (Date & Select)
    const [date, setDate] = useState<Date>(new Date());
    const [method, setMethod] = useState("cash");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <Banknote className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Enter the payment details for facture <strong>{facture.number}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    resetOnSuccess={['amount', 'reference']}
                    onSuccess={() => {
                        toast.success('Payment has been recorded!');
                        setOpen(false);
                        setDate(new Date());
                        setMethod("cash");
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Hidden Inputs for values managed by state */}
                            <input type="hidden" name="facture_id" value={facture.id} />
                            <input type="hidden" name="payment_date" value={date ? format(date, "yyyy-MM-dd") : ""} />
                            <input type="hidden" name="method" value={method} />

                            {/* Amount Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (DH)</Label>
                                <Input 
                                    id="amount" 
                                    name="amount" 
                                    type="number" 
                                    step="0.01" 
                                    required 
                                    placeholder="0.00" 
                                    autoFocus
                                />
                                <InputError message={errors.amount} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date Picker */}
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "dd-MM-yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={(d) => d && setDate(d)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.payment_date} />
                                </div>

                                {/* Method Select */}
                                <div className="grid gap-2">
                                    <Label>Method</Label>
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="check">Check</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.method} />
                                </div>
                            </div>

                            {/* Reference Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="reference">Reference (Optional)</Label>
                                <Input 
                                    id="reference" 
                                    name="reference" 
                                    placeholder="Ex: CHK-12345" 
                                />
                                <InputError message={errors.reference} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing && <Spinner />}
                                    Save Payment
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}