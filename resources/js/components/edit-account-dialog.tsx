import { Form } from "@inertiajs/react";
import { Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { update } from "@/routes/accounts";

interface Account {
    id: number;
    name: string;
    type: string;
    title: string | null;
}

export default function EditAccountDialog({ account }: { account: Account }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen} key={`edit-account-${account.id}-${open}`}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le compte</DialogTitle>
                    <DialogDescription>
                        Apportez des modifications aux détails du compte ici.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={update(account.id).url}
                    method="post"
                    data={{
                        _method: 'patch',
                        name: account.name,
                        type: account.type,
                        title: account.title || '',
                    } as any}
                    onSuccess={() => {
                        toast.success('Compte mis à jour ! ✨');
                        setOpen(false);
                    }}
                >
                    {({ processing }) => (
                        <div className="space-y-4 pt-4">
                            <input type="hidden" name="_method" value="PATCH" />

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Nom</label>
                                <Input
                                    name="name"
                                    defaultValue={account.name}
                                    placeholder="Nom du compte"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Titre</label>
                                <Input
                                    name="title"
                                    defaultValue={account.title || ''}
                                    placeholder="Titre ou Référence"
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Type</label>
                                <Input
                                    name="type"
                                    defaultValue={account.type}
                                    placeholder="Client, Fournisseur, etc."
                                    required
                                />
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
                                    ) : 'Enregistrer les modifications'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
};