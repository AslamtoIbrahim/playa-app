import { router, usePage } from "@inertiajs/react";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { destroy } from "@/routes/customers";
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
} from "./ui/alert-dialog";

export default function DeleteCustomerDialog({ customerId, customerName }: { customerId: number, customerName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false); // باش نتحكمو فـ سدان الـ Dialog

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(destroy(customerId).url, {
            onSuccess: (page) => {
                const flash = page.props.flash as any;
                
                if (flash?.success) {
                    toast.success(flash.success);
                    setOpen(false); // نسدو الـ Dialog غير إلا نجحت العملية
                }
                
                if (flash?.error) {
                    toast.error(flash.error, {
                        duration: 6000,
                        icon: <AlertCircle className="h-5 w-5 text-red-500" />
                    });
                    // هنا مانسدوش الـ Dialog باش المستخدم يشوف الميساج ويعرف علاش ماتمسحش
                }
            },
            onError: () => {
                toast.error("Une erreur imprévue est survenue.");
            },
            onFinish: () => setIsDeleting(false),
            preserveScroll: true,
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        Confirmer l'archivage
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Voulez-vous vraiment archiver le client **{customerName}** ?
                        </p>
                        <div className="rounded-md bg-amber-50 p-3 border border-amber-100">
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Note:</strong> Si ce client est lié à des factures ou des bateaux, l'archivage sera bloqué pour préserver l'intégrité des données.
                            </p>
                        </div>
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
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Suppression...</>
                        ) : 'Confirmer'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}