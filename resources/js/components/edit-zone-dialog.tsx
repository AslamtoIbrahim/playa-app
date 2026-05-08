import { Form } from "@inertiajs/react";
import { Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { update } from "@/routes/zones"; // Assuming update route for zones is defined
import { Zone } from "@/types/zone"; // Assuming Zone type is defined
import InputError from "@/components/input-error";

export default function EditZoneDialog({ zone }: { zone: Zone }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen} key={`edit-zone-${zone.id}-${open}`}>
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
                    <DialogTitle>Modifier la zone</DialogTitle>
                    <DialogDescription>
                        Mise à jour des informations pour la zone **{zone.name}**.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={update(zone.id).url}
                    method="post"
                    data={{
                        _method: 'patch',
                        name: zone.name,
                    } as any}
                    onSuccess={() => {
                        toast.success('Zone mise à jour ! ✨');
                        setOpen(false);
                    }}
                >
                    {({ processing, errors }) => (
                        <div className="space-y-4 pt-4">
                            {/* Laravel PATCH Method Trick */}
                            <input type="hidden" name="_method" value="PATCH" />

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nom</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={zone.name}
                                    placeholder="ex: Zone Nord"
                                    required
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
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}