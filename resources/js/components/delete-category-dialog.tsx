import { router } from '@inertiajs/react';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { destroy } from '@/routes/categories';

interface Props {
    categoryId: number;
    categoryName: string;
}

interface FlashMessage {
    success?: string;
    error?: string;
}

export default function DeleteCategoryDialog({
    categoryId,
    categoryName,
}: Props) {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(destroy(categoryId).url, {
            onSuccess: (page) => {
                const flash = page.props.flash as FlashMessage;

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
            onFinish: () => {
                return setIsDeleting(false);
            },
            preserveScroll: true,
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-neutral-800 dark:hover:text-red-400"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="dark:bg-neutral-900 dark:border-neutral-800">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        Confirmer l'archivage
                    </AlertDialogTitle>

                    <AlertDialogDescription className="space-y-3 text-slate-600 dark:text-neutral-400">
                        <p>
                            Voulez-vous vraiment archiver la catégorie{' '}
                            <strong className="text-slate-900 dark:text-neutral-100">
                                {categoryName}
                            </strong>{' '}
                            ?
                        </p>

                        <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-100 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                            <strong>Note :</strong> L'archivage sera bloqué si
                            cette catégorie contient encore des articles. Vous
                            devez d'abord supprimer ou déplacer les articles
                            qu'elle contient.
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel
                        disabled={isDeleting}
                        className="dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:border-neutral-700"
                    >
                        Annuler
                    </AlertDialogCancel>

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
                                Archivage...
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
