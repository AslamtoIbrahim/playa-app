import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    count: number;
    /**
     * Number of differences linked to the invoice lines being deleted.
     * When greater than zero, a warning with a confirmation checkbox is shown.
     */
    differenceCount: number;
    /**
     * Number of sale lines linked to the invoice lines being deleted.
     * When greater than zero, a warning with a confirmation checkbox is shown.
     */
    saleCount: number;
}

/**
 * Delete confirmation dialog for invoice lines.
 *
 * When the targeted lines carry differences or sales, the dialog warns the
 * user about the related data that will be removed as well and requires an
 * explicit checkbox confirmation before enabling the confirm button.
 */
export function DeleteInvoiceItemsDialog({
    open,
    onOpenChange,
    onConfirm,
    count,
    differenceCount,
    saleCount,
}: Props) {
    const hasRelatedData = differenceCount > 0 || saleCount > 0;
    const [confirmed, setConfirmed] = useState(false);

    // The confirmation restarts each time the dialog is reopened.
    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setConfirmed(false);
        }

        onOpenChange(nextOpen);
    };

    const handleConfirm = () => {
        if (hasRelatedData && !confirmed) {
            return;
        }

        onConfirm();
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="dark:border-neutral-800 dark:bg-neutral-900">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-slate-900 dark:text-neutral-100">
                        {hasRelatedData
                            ? 'Supprimer avec les données liées ?'
                            : 'Êtes-vous absolument sûr ?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-600 dark:text-neutral-400">
                        Cette action est irréversible. Vous allez supprimer{' '}
                        {count} ligne{count > 1 ? 's' : ''} de cette facture.
                    </AlertDialogDescription>

                    {hasRelatedData && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
                            <div className="flex gap-3">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div className="space-y-2">
                                    <p className="text-xs leading-relaxed font-medium text-amber-800 dark:text-amber-300">
                                        Des données sont liées à cette sélection
                                        :
                                        {differenceCount > 0 && (
                                            <span className="block">
                                                • {differenceCount} différence
                                                {differenceCount > 1
                                                    ? 's'
                                                    : ''}{' '}
                                                à supprimer
                                            </span>
                                        )}
                                        {saleCount > 0 && (
                                            <span className="block">
                                                • {saleCount} vente
                                                {saleCount > 1 ? 's' : ''} à
                                                supprimer
                                            </span>
                                        )}
                                    </p>

                                    <label
                                        htmlFor="confirm-delete-related"
                                        className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-amber-800 select-none dark:text-amber-300"
                                    >
                                        <Checkbox
                                            id="confirm-delete-related"
                                            checked={confirmed}
                                            onCheckedChange={(checked) => {
                                                setConfirmed(checked === true);
                                            }}
                                            className="mt-0.5 border-amber-400 data-[state=checked]:border-amber-600 data-[state=checked]:bg-amber-600 dark:border-amber-700"
                                        />
                                        <span>
                                            Je comprends et j'accepte la
                                            suppression de toutes les
                                            différences et ventes liées à ces
                                            lignes.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel className="text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={hasRelatedData && !confirmed}
                        className={cn(
                            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
                            hasRelatedData &&
                                !confirmed &&
                                'cursor-not-allowed opacity-50',
                        )}
                    >
                        Supprimer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
