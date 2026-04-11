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
    DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { update } from "@/routes/office-rooms";
import { OfficeRoom } from "@/types/office-room";
import InputError from "@/components/input-error";

export default function EditOfficeRoomDialog({ officeRoom }: { officeRoom: OfficeRoom }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen} key={`edit-office-${officeRoom.id}-${open}`}>
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
                    <DialogTitle>Modifier le bureau</DialogTitle>
                    <DialogDescription>
                        Mise à jour des informations pour le bureau **{officeRoom.name}**.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={update(officeRoom.id).url}
                    method="post"
                    data={{
                        _method: 'patch',
                        name: officeRoom.name,
                        city: officeRoom.city || '',
                    } as any}
                    onSuccess={() => {
                        toast.success('Bureau mis à jour ! ✨');
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
                                    defaultValue={officeRoom.name} 
                                    placeholder="ex: Bureau A" 
                                    required 
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="city">Ville</Label>
                                <Input 
                                    id="city"
                                    name="city" 
                                    defaultValue={officeRoom.city || ''} 
                                    placeholder="ex: Casablanca" 
                                />
                                <InputError message={errors.city} />
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
                                    ) : 'Enregistrer'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}