import { Form } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { store } from '@/routes/customers';

interface MissingCustomerPopupProps {
    initialName?: string;
    onCreated?: (name: string) => void;
}

export default function MissingCustomerPopup({
    initialName = '',
    onCreated,
}: MissingCustomerPopupProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [name, setName] = useState<string>(initialName);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (nextOpen) {
                    setName(initialName);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Ajouter un client"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Ajouter un client</DialogTitle>
                    <DialogDescription>
                        Ce client n&apos;est pas dans les suggestions.
                        Ajoutez-le directement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Le client a été créé avec succès !');
                        onCreated?.(name.trim());
                        setOpen(false);
                    }}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="name"
                                value={name.trim()}
                            />
                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Nom du client"
                                required
                            />
                            <InputError message={errors.name} />

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={processing || !name.trim()}
                                >
                                    Ajouter le client
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
