import { router } from "@inertiajs/react";
import { Loader2, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
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
import { destroy } from "@/routes/invoices"; // تأكد من المسار الصحيح

interface Props {
    invoiceId: number;
    invoiceNumber: string;
    amount: number; // زدنا هادي باش نعرفو واش نطلعو الميساج ولا لا
    trigger?: React.ReactNode;
}

export default function DeleteInvoiceDialog({ invoiceId, invoiceNumber, amount, trigger }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(destroy(invoiceId).url, {
            onSuccess: (page) => {
                const flash = page.props.flash as any;
                if (flash?.success) {
                    toast.success(flash.success);
                    setOpen(false);
                }
                if (flash?.error) {
                    toast.error(flash.error, {
                        duration: 6000,
                        icon: <AlertCircle className="h-5 w-5 text-red-500" />
                    });
                }
            },
            onFinish: () => setIsDeleting(false),
            preserveScroll: true,
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger ? trigger : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Confirmer l'archivage
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Voulez-vous vraiment archiver la facture **{invoiceNumber}** ?
                        </p>

                        {/* هاد الجزء غايطلع غير إلا كان المبلع كبر من 0 */}
                        {amount > 0 && (
                            <div className="rounded-md bg-red-50 p-3 border border-red-100 text-xs text-red-800 leading-relaxed">
                                <strong>Règle de sécurité :</strong> Cette facture contient un montant de <strong>{amount} DH</strong>. 
                                Elle ne peut pas être archivée tant qu'elle n'est pas vide.
                            </div>
                        )}
                        
                        {/* ميساج عادي إلا كانت خاوية */}
                        {amount <= 0 && (
                            <p className="text-sm text-slate-500 italic">
                                Cette facture est vide, elle sera déplacée vers les archives.
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
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Vérification...
                            </>
                        ) : 'Confirmer'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}