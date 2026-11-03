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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { destroy } from '@/routes/usines';
import { router } from '@inertiajs/react';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    usineId: number;
    usineName: string;
}

interface FlashMessage {
    success?: string;
    error?: string;
}

export default function DeleteUsineDialog({ usineId, usineName }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(destroy(usineId).url, {
            onSuccess: (page) => {
                const flash = page.props.flash as FlashMessage | undefined;

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
                toast.error('Une erreur imprévue est survenue.');
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
                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Supprimer ${usineName}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        Confirmer la suppression
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Voulez-vous vraiment supprimer l’usine « {usineName} » ?
                        Cette action est irréversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            event.preventDefault();
                            handleDelete();
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Suppression...
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
