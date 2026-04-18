import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { update } from '@/routes/customers';
import { Customer } from '@/types/customers';
import { Form } from '@inertiajs/react';
import { Loader2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from './input-error';

export default function EditCustomerDialog({ customer }: { customer: Customer }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
            key={`edit-customer-${customer.id}-${open}`}
        >
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le compte</DialogTitle>
                    <DialogDescription>
                        Apportez des modifications au nom du client ici.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={update(customer.id).url}
                    method="post"
                    data={{
                        _method: 'patch',
                        name: customer.name,
                    } as any}
                    onSuccess={() => {
                        toast.success('Compte mis à jour ! ✨');
                        setOpen(false);
                    }}
                >
                    {({ processing, errors}) => (
                        <div className="space-y-4 pt-4">
                            <input type="hidden" name="_method" value="PATCH" />

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    Nom du client
                                </label>
                                <Input
                                    name="name"
                                    defaultValue={customer.name}
                                    placeholder="Nom du compte"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        'Enregistrer les modifications'
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