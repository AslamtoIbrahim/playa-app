import { Form } from '@inertiajs/react';
import { Plus, UserPlus } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/workers';

export default function AddWorkerDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un ouvrier
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-neutral-100 dark:bg-neutral-800 dark:text-neutral-50">
                            <UserPlus className="h-4 w-4" />
                        </div>
                        <DialogTitle className="text-neutral-900 dark:text-neutral-100">Nouvel ouvrier</DialogTitle>
                    </div>
                    
                    <DialogDescription className="pt-1 text-neutral-600 dark:text-neutral-400">
                        Créez un nouveau compte pour un ouvrier. Le nom doit être unique.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    resetOnSuccess={['name']}
                    onSuccess={() => {
                        {
                            toast.success('L\'ouvrier a été créé avec succès !');
                            
                            setOpen(false);
                        }
                    }}
                    className="space-y-5 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-neutral-500">
                                    Nom complet de l'ouvrier
                                </Label>
                                
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    placeholder="ex: Mohammed Alami"
                                    className="h-11 focus-visible:ring-neutral-400"
                                />
                                
                                <InputError message={errors.name} />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        {
                                            setOpen(false);
                                        }
                                    }}
                                    disabled={processing}
                                >
                                    Annuler
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="min-w-35 text-white! bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:!text-white dark:hover:bg-neutral-700"
                                >
                                    {processing && <Spinner className="mr-2 h-4 w-4 text-white! dark:!text-white" />}
                                    Enregistrer l'ouvrier
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}