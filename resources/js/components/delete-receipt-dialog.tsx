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
import type { SaleCharge } from "@/types/sale-charge";

interface Props {
    receiptId: number;
    amount: number;
    saleCharges?: SaleCharge[];
    trigger?: React.ReactNode;
}

export default function DeleteReceiptDialog({ receiptId, amount, saleCharges = [], trigger }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);

    const hasAmount = amount > 0;
    const hasLinkedSales = saleCharges.length > 0;

    const handleDelete = () => {
        setIsDeleting(true);

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
                        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
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
                            Voulez-vous vraiment supprimer le bon{' '}
                            <strong>#{receiptId}</strong> ?
                        </p>

                        {/* Receipt still has amount — block with a warning */}
                        {hasAmount && (
                            <div className="rounded-md bg-red-50 p-3 border border-red-100 text-xs text-red-800 leading-relaxed">
                                <p className="font-bold mb-1">Suppression impossible :</p>
                                Ce bon contient encore un montant de{' '}
                                <strong>{amount.toLocaleString('fr-FR')} DH</strong>.
                                Videz d'abord tous les articles avant de le supprimer.
                            </div>
                        )}

                        {/* Empty receipt but linked to one or more sales */}
                        {!hasAmount && hasLinkedSales && (
                            <div className="rounded-md bg-orange-50 p-3 border border-orange-100 text-xs text-orange-800 leading-relaxed">
                                <p className="font-bold mb-1">Attention :</p>
                                Ce bon est lié à{' '}
                                <strong>
                                    {saleCharges.length} vente
                                    {saleCharges.length > 1 ? 's' : ''}
                                </strong>
                                . La suppression effacera également ces imputations
                                et recalculera automatiquement les totaux des ventes
                                concernées.
                            </div>
                        )}

                        {/* Completely empty receipt, no linked sales */}
                        {!hasAmount && !hasLinkedSales && (
                            <p className="text-sm text-slate-500 italic">
                                Ce bon est vide, il sera supprimé définitivement.
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
                        disabled={isDeleting || hasAmount}
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