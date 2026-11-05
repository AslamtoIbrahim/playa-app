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
import { store } from '@/routes/usines';

interface MissingUsinePopupProps {
    initialName?: string;
    onCreated?: (name: string) => void;
}

export default function MissingUsinePopup({
    initialName = '',
    onCreated,
}: MissingUsinePopupProps) {
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
                    aria-label="Ajouter une usine"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Ajouter une usine</DialogTitle>
                    <DialogDescription>
                        Cette usine n&apos;est pas dans les suggestions.
                        Ajoutez-la directement.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('L’usine a été créée avec succès !');
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
                                placeholder="Nom de l’usine"
                                required
                            />
                            <InputError message={errors.name} />

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={processing || !name.trim()}
                                >
                                    Ajouter l’usine
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
