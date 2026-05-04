import { Button } from "@/components/ui/button";
import { destroy } from "@/routes/workers";
import { router } from "@inertiajs/react";
import { AlertCircle, Loader2, Trash2, UserX } from "lucide-react";
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
} from "./ui/alert-dialog";

interface Props {
    workerId: number;
    workerName: string;
}

export default function DeleteWorkerDialog({ workerId, workerName }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        {
            setIsDeleting(true);

            router.delete(destroy(workerId).url, {
                onSuccess: (page) => {
                    {
                        const flash = page.props.flash as any;

                        if (flash?.success) {
                            {
                                toast.success(flash.success);
                                
                                setOpen(false);
                            }
                        }

                        if (flash?.error) {
                            {
                                toast.error(flash.error, {
                                    duration: 6000,
                                    icon: <AlertCircle className="h-5 w-5 text-red-500" />
                                });
                            }
                        }
                    }
                },
                onError: () => {
                    {
                        toast.error("Une erreur imprévue est survenue.");
                    }
                },
                onFinish: () => {
                    {
                        setIsDeleting(false);
                    }
                },
                preserveScroll: true,
            });
        }
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
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 font-semibold">
                        <UserX className="h-5 w-5" />
                        Supprimer l'ouvrier
                    </AlertDialogTitle>

                    <AlertDialogDescription className="space-y-4 pt-2">
                        <p className="text-slate-600">
                            Voulez-vous vraiment supprimer l'ouvrier <span className="font-bold text-slate-900 capitalize">{workerName}</span> ?
                        </p>

                        <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                            
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-red-800 uppercase tracking-tight">Attention</p>
                                
                                <p className="text-xs text-red-700 leading-relaxed">
                                    Si cet ouvrier a déjà des pointages enregistrés, la suppression sera refusée. L'historique doit être conservé.
                                </p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="pt-2">
                    <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                    
                    <AlertDialogAction
                        onClick={(e) => {
                            {
                                e.preventDefault();
                                
                                handleDelete();
                            }
                        }}
                        className="bg-red-600 hover:bg-red-700 min-w-[120px]"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Patientez...
                            </>
                        ) : (
                            'Confirmer'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}