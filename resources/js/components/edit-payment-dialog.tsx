import { Form } from "@inertiajs/react";
import { Pencil, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { update } from "@/routes/payments"; // تأكد أن هاد الـ route كاين عندك فـ Wayfinder
import { Payment } from "@/types/payments";

interface Props {
    payment: Payment; // تقدر تعوضها بـ Type Payment إيلا كان واجد
}

export default function EditPaymentDialog({ payment }: Props) {
    const [open, setOpen] = useState(false);

    // States local لـ التاريخ والـ Method
    const [date, setDate] = useState<Date>(parseISO(payment.payment_date));
    const [method, setMethod] = useState(payment.method);

    return (
        <Dialog open={open} onOpenChange={setOpen} key={`edit-payment-${payment.id}-${open}`}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Payment</DialogTitle>
                    <DialogDescription>
                        Modify the payment details for facture {payment.facture?.number}.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={update(payment.id).url}
                    method="post"
                    data={{
                        _method: 'patch',
                        amount: payment.amount,
                        payment_date: format(date, "yyyy-MM-dd"),
                        method: method,
                        reference: payment.reference,
                    } as any}
                    onSuccess={() => {
                        toast.success('Payment updated! 💰');
                        setOpen(false);
                    }}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4 pt-4">
                            {/* Method Spoofing */}
                            <input type="hidden" name="_method" value="PATCH" />
                            <input type="hidden" name="payment_date" value={format(date, "yyyy-MM-dd")} />
                            <input type="hidden" name="method" value={method} />

                            {/* Amount */}
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (DH)</Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    required
                                    defaultValue={payment.amount}
                                />
                                {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date Picker */}
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
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
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Method Select */}
                                <div className="grid gap-2">
                                    <Label>Method</Label>
                                    <Select
                                        value={method}
                                        onValueChange={(value: string) => setMethod(value as Payment['method'])}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="check">Check</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Reference */}
                            <div className="grid gap-2">
                                <Label htmlFor="reference">Reference (Optional)</Label>
                                <Input
                                    id="reference"
                                    name="reference"
                                    placeholder="Check number, etc."
                                    defaultValue={payment.reference ?? ""}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : 'Update Payment'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}