import { router } from "@inertiajs/react";
import { AlertCircle, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { destroy } from "@/routes/sales";

interface Props {
    saleId: number;
    customerName: string;
    amount: number;
    trigger?: React.ReactNode;
}

export default function DeleteSaleDialog({ saleId, customerName, amount, trigger }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(destroy(saleId).url, {
            onSuccess: (page) => {
                const flash = page.props.flash as any;

                if (flash?.success) {
                    toast.success(flash.success);
                    setOpen(false);
                }

                if (flash?.error) {
                    toast.error(flash.error, {
                        duration: 6000,
                        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
                    });
                }
            },
            onFinish: () => {
                setIsDeleting(false);
            },
            preserveScroll: true,
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Confirmer la suppression
                    </AlertDialogTitle>

                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Voulez-vous vraiment supprimer la vente du client{" "}
                            <strong className="text-slate-900">{customerName}</strong> ?
                        </p>

                        {amount > 0 && (
                            <div className="rounded-md border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-800">
                                <strong>Règle de sécurité :</strong> Cette vente contient des articles d'une valeur de{" "}
                                <strong>{amount} DH</strong>. Elle ne peut pas être supprimée tant qu'elle n'est pas
                                vide (veuillez d'abord retirer les articles).
                            </div>
                        )}

                        {amount <= 0 && (
                            <p className="text-sm italic text-slate-500">
                                Cette vente est vide, elle sera définitivement supprimée de la base de données.
                            </p>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>

                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();

                            handleDelete();
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting || amount > 0}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Suppression...
                            </>
                        ) : (
                            "Confirmer"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}