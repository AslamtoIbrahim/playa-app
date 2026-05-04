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
import { update } from '@/routes/workers';
import { Worker } from '@/types/worker';
import { Form } from '@inertiajs/react';
import { Loader2, Pencil, UserCog } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from './input-error';

interface Props {
    worker: Worker;
}

export default function EditWorkerDialog({ worker }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
            key={`edit-worker-${worker.id}-${open}`}
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

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-blue-600" />
                        
                        <DialogTitle>Modifier l'ouvrier</DialogTitle>
                    </div>

                    <DialogDescription className="pt-1">
                        Mettez à jour les informations de <span className="font-semibold text-slate-900">{worker.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={update(worker.id).url}
                    method="post"
                    data={{
                        _method: 'patch',
                        name: worker.name,
                    } as any}
                    onSuccess={() => {
                        {
                            toast.success('Informations mises à jour ! ✨');
                            
                            setOpen(false);
                        }
                    }}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-5 pt-4">
                            <input type="hidden" name="_method" value="PATCH" />

                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-slate-500">
                                    Nom complet
                                </Label>

                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={worker.name}
                                    placeholder="Nom de l'ouvrier"
                                    required
                                    autoFocus
                                    className="h-11 focus-visible:ring-blue-400"
                                />

                                <InputError message={errors.name} />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
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
                                    className="min-w-35"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        'Mettre à jour'
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