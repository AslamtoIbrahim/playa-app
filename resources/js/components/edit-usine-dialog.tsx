import InputError from '@/components/input-error';
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
import { Label } from '@/components/ui/label';
import { update } from '@/routes/usines';
import type { Usine } from '@/types/usine';
import { Form } from '@inertiajs/react';
import { Loader2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    usine: Usine;
}

export default function EditUsineDialog({ usine }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
            key={`edit-usine-${usine.id}-${open}`}
        >
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                    aria-label={`Modifier ${usine.name}`}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Modifier l’usine</DialogTitle>
                    <DialogDescription>
                        Modifier le nom de l’usine « {usine.name} ».
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...update.form(usine.id)}
                    onSuccess={() => {
                        toast.success('Usine mise à jour avec succès !');
                        setOpen(false);
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor={`usine-name-${usine.id}`}>
                                    Nom de l’usine
                                </Label>
                                <Input
                                    id={`usine-name-${usine.id}`}
                                    name="name"
                                    defaultValue={usine.name}
                                    placeholder="Nom de l’usine"
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
                                    disabled={processing}
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
                                        'Enregistrer'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
