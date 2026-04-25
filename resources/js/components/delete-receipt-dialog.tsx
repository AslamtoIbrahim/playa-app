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
import { destroy } from "@/routes/receipts";

// تأكد من مسار الـ Route عندك، غالباً غاتكون بحال هكا:
// import { destroy } from "@/routes/receipts"; 

interface Props {
    receiptId: number;
    amount: number; 
    trigger?: React.ReactNode;
}

export default function DeleteReceiptDialog({ receiptId, amount, trigger }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        // غانستعملو المسار ديال الـ delete الخاص بالـ receipts
        router.delete(destroy(receiptId).url, {
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
                        Confirmer la suppression
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3 text-left">
                        <p>
                            Voulez-vous vraiment supprimer le reçu **{receiptId}** ?
                        </p>

                        {/* Logic ديال الحماية: إذا كان الواصل فيه مبلغ */}
                        {amount > 0 && (
                            <div className="rounded-md bg-red-50 p-3 border border-red-100 text-xs text-red-800 leading-relaxed">
                                <p className="font-bold mb-1">Attention :</p>
                                Ce reçu contient un montant de <strong>{amount} DH</strong>. 
                                Il est recommandé de vider le montant avant la suppression pour garder une comptabilité précise.
                            </div>
                        )}
                        
                        {amount <= 0 && (
                            <p className="text-sm text-slate-500 italic">
                                Ce reçu est vide, il sera supprimé définitivement.
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
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Suppression...
                            </>
                        ) : 'Supprimer'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}