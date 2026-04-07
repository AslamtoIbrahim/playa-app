import { Form } from "@inertiajs/react";
import { Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { update } from "@/routes/accounts"; // Wayfinder route

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
                    <DialogTitle>Edit Account</DialogTitle>
                    <DialogDescription>
                        Make changes to the account details here.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action={update(account.id).url}
                    method="post"
                    // كنصيفطو الـ data البدئية وكنزيدو _method: patch
                    data={{
                        _method: 'patch',
                        name: account.name,
                        type: account.type,
                        title: account.title || '',
                    } as any}
                    onSuccess={() => {
                        toast.success('Account updated! ✨');
                        setOpen(false);
                    }}
                >
                    {({ processing }) => (
                        <div className="space-y-4 pt-4">
                            {/* السحر اللي كيخلي Laravel يفهم أنها PATCH رغم أنها POST */}
                            <input type="hidden" name="_method" value="PATCH" />

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input 
                                    name="name" 
                                    defaultValue={account.name} 
                                    placeholder="Account Name" 
                                    required 
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Type</label>
                                <Input 
                                    name="type" 
                                    defaultValue={account.type} 
                                    placeholder="Client, Vendor, etc." 
                                    required 
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input 
                                    name="title" 
                                    defaultValue={account.title || ''} 
                                    placeholder="Title or Reference" 
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
};
