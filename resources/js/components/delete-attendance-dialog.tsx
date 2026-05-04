import { router } from "@inertiajs/react";
import { format, parseISO } from "date-fns";
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

// Wayfinder function
import { destroy } from "@/routes/attendances";

interface Props {
    attendanceId: number;
    date: string;
    trigger?: React.ReactNode;
}

export default function DeleteAttendanceDialog({
    attendanceId,
    date,
    trigger,
}: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(destroy(attendanceId).url, {
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
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 font-bold uppercase tracking-tight">
                        <AlertTriangle className="h-5 w-5" />
                        Confirmer la suppression
                    </AlertDialogTitle>

                    <AlertDialogDescription className="space-y-3 text-left pt-2">
                        <p className="text-slate-600">
                            Êtes-vous sûr de vouloir supprimer le pointage du{" "}
                            <strong className="text-slate-900">
                                {format(parseISO(date), "dd MMMM yyyy")}
                            </strong>
                            ?
                        </p>

                        <div className="rounded-md bg-amber-50 p-3 border border-amber-100 text-xs text-amber-800 leading-relaxed">
                            <p className="font-bold mb-1 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Note :
                            </p>
                            Cette action est irréversible. Toutes les données de présence liées à cette date seront définitivement supprimées.
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel disabled={isDeleting}>
                        Annuler
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Suppression...
                            </>
                        ) : (
                            "Supprimer définitivement"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}