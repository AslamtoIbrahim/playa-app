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
                <Button size="sm" >
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un ouvrier
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                            <UserPlus className="h-4 w-4 text-slate-600" />
                        </div>
                        <DialogTitle>Nouvel ouvrier</DialogTitle>
                    </div>
                    
                    <DialogDescription className="pt-1">
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
                                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-slate-500">
                                    Nom complet de l'ouvrier
                                </Label>
                                
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    placeholder="ex: Mohammed Alami"
                                    className="h-11 focus-visible:ring-slate-400"
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
                                    className="min-w-35 bg-slate-900 hover:bg-slate-800"
                                >
                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
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