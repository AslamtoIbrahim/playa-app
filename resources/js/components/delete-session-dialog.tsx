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
import { destroy } from "@/routes/sessions"; // تأكد من المسار
import { router } from "@inertiajs/react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
    sessionId: number;
    sessionDate: string;
}

export default function DeleteSessionDialog({ sessionId, sessionDate }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(destroy(sessionId).url, {
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
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 uppercase font-black">
                        <AlertCircle className="h-5 w-5" />
                        Supprimer la session
                    </AlertDialogTitle>
                    
                    <AlertDialogDescription className="space-y-4">
                        <p>
                            Voulez-vous vraiment supprimer la session du 
                            <span className="font-bold text-slate-900 mx-1">
                                {format(new Date(sessionDate), "PPP", { locale: fr })}
                            </span> ?
                        </p>
                        
                        <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20 text-destructive">
                            <p className="text-xs leading-relaxed font-medium">
                                <strong>Règle de sécurité:</strong> La suppression sera refusée si la session est déjà clôturée ou si elle contient des transactions (achats/ventes).
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Annuler
                    </AlertDialogCancel>
                    
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        className="bg-red-600 hover:bg-red-700 font-bold"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Suppression...
                            </>
                        ) : (
                            'Supprimer définitivement'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}