import { destroy, store, update } from '@/routes/sale-items';
import { SaleItem } from '@/types/sale-item';
import { navigateToAdjacentCell } from '@/lib/table-navigation';
import { router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { KeyboardEvent, useState } from 'react';
import { toast } from 'sonner';

/** Flash messages shared with the frontend by the backend middleware. */
interface FlashMessage {
    success?: string | null;
    error?: string | null;
}

interface UseSaleRowProps {
    /** Distribution existante (mode édition) ou absente (nouvelle vente). */
    saleItem?: SaleItem;
    /** Ligne de facture d'achat vendue. */
    invoiceItemId: number;
    /** Prix unitaire facturé, proposé par défaut dans la colonne « P.R ». */
    unitPrice?: number;
    /** Quantité encore vendable sur la ligne de facture. */
    maxAvailable: number;
    isNew?: boolean;
    onSuccess?: () => void;
    onDelete?: (id: number) => void;
    /**
     * Notifie un enregistrement discret pour que le dialogue puisse regrouper
     * les confirmations et n'afficher qu'un toast à la fermeture.
     */
    onSilentSave?: () => void;
}

interface SaleRowData {
    sale_id: string;
    unit_count: string;
    real_price: string;
}

interface SubmitSaveOptions {
    /**
     * Enregistrement « discret » : la donnée est persistée sans toast.
     *
     * Chaque changement de cellule (flèches du clavier, perte de focus,
     * sélection d'une autre vente) enregistre la ligne. Afficher un toast à
     * chaque passage interromp la saisie et noie les confirmations utiles :
     * ces enregistrements restent donc silencieux, et le dialogue regroupe
     * les confirmations en un seul message à la fermeture.
     */
    silent?: boolean;
}

/**
 * Valeur proposée par défaut dans un champ numérique.
 *
 * Les cellules d'une nouvelle ligne sont pré-remplies avec la quantité
 * restante et le prix unitaire facturé : l'utilisateur choisit son client puis
 * ne saisit une valeur que s'il y a un écart à corriger. La conversion passe
 * par `Number` pour éviter les décimales inutiles (`90.0000000001`) et les
 * notations scientifiques.
 */
function toInputValue(value?: number | null): string {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '';
    }

    return String(Number(value));
}

/**
 * Enregistrement d'une vente depuis une ligne de facture d'achat.
 *
 * Le dialogue de vente reprend la mécanique du dialogue de répartition : une
 * ligne « nouvelle » se valide automatiquement (bouton ✓), une ligne
 * existante se met à jour au fil de la saisie et se supprime à la corbeille.
 */
export function useSaleRow({
    saleItem,
    invoiceItemId,
    unitPrice,
    maxAvailable,
    isNew,
    onSuccess,
    onDelete,
    onSilentSave,
}: UseSaleRowProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const [openSale, setOpenSale] = useState<boolean>(false);

    // Une nouvelle ligne est pré-remplie : toute la quantité restante au prix
    // facturé, soit un écart nul. L'utilisateur choisit son client et ne corrige
    // la quantité ou le prix que s'il y a une différence à enregistrer.
    //
    // Ces valeurs par défaut sont dérivées, pas stockées : une fois la ligne
    // enregistrée et rechargée, la saisie est vidée et les cellules rebasculent
    // automatiquement sur le nouveau reste, sans effet ni copie manuelle.
    const [input, setInput] = useState<Partial<SaleRowData>>({});

    // Une distribution existante garde ses propres valeurs, une nouvelle ligne
    // part sur la quantité restante et le prix unitaire facturé.
    const defaultUnitCount = saleItem
        ? (saleItem.unit_count?.toString() ?? '')
        : toInputValue(isNew ? maxAvailable : null);

    const defaultRealPrice = saleItem
        ? (saleItem.real_price?.toString() ?? '')
        : toInputValue(isNew ? unitPrice : null);

    const data: SaleRowData = {
        sale_id: input.sale_id ?? saleItem?.sale_id?.toString() ?? '',
        unit_count: input.unit_count ?? defaultUnitCount,
        real_price: input.real_price ?? defaultRealPrice,
    };

    const handleDataChange = (updates: Partial<SaleRowData>): void => {
        setInput((prev) => {
            {
                return { ...prev, ...updates };
            }
        });
    };

    const isReadyToSave = (currentData = data): boolean => {
        {
            return (
                currentData.sale_id !== '' &&
                Number(currentData.unit_count) > 0 &&
                currentData.real_price !== ''
            );
        }
    };

    const submitSave = (
        currentData = data,
        { silent = false }: SubmitSaveOptions = {},
    ): void => {
        if (!isReadyToSave(currentData) || loading) {
            {
                return;
            }
        }

        const newCount = parseFloat(currentData.unit_count);

        // `maxAvailable` est déjà la quantité vendable *de cette ligne* : le
        // dialogue y a réintégré la quantité propre de la ligne pour que celle-ci
        // puisse conserver ce qu'elle vend déjà. Le réadditionner ici autorisait
        // un dépassement que le serveur rejette ensuite.
        const limit = maxAvailable;

        if (newCount > limit) {
            {
                toast.error(`Quantité impossible. Max: ${limit.toFixed(2)}`);

                return;
            }
        }

        setLoading(true);

        const options = {
            preserveScroll: true,

            onSuccess: (page: Page): void => {
                {
                    // Le serveur refuse un dépassement par une redirection
                    // assortie d'un flash d'erreur : Inertia la voit comme un
                    // succès. Sans ce contrôle, une vente refusée affichait
                    // « Mise à jour » alors que rien n'avait été enregistré.
                    const flash = page.props.flash as FlashMessage | undefined;

                    if (flash?.error) {
                        // La saisie refusée n'est pas conservée localement : on
                        // repart des valeurs réellement enregistrées, sans quoi
                        // la cellule afficherait encore une quantité refusée. La
                        // vente choisie est conservée : elle reste valide.
                        setInput((prev) => {
                            {
                                return {
                                    sale_id:
                                        prev.sale_id ??
                                        saleItem?.sale_id?.toString() ??
                                        '',
                                };
                            }
                        });

                        toast.error(flash.error, { duration: 6000 });

                        return;
                    }

                    // Un enregistrement discret (changement de cellule) ne
                    // confirme rien individuellement : il est seulement
                    // comptabilisé, le dialogue resumera la session à la
                    // fermeture. Les erreurs, elles, remontent toujours.
                    if (silent) {
                        {
                            if (onSilentSave) {
                                {
                                    onSilentSave();
                                }
                            }
                        }
                    } else {
                        {
                            toast.success(
                                isNew ? 'Vente enregistrée' : 'Mise à jour',
                            );
                        }
                    }

                    if (isNew) {
                        // La ligne repart vierge côté client. Les deux cellules
                        // retombent sur les valeurs par défaut (nouveau reste au
                        // prix facturé) sans passer par un effet : il suffit de
                        // vider la saisie, les valeurs dérivées reprennent la
                        // main dès que la ligne est rechargée.
                        setInput({});
                    }

                    if (onSuccess) {
                        {
                            onSuccess();
                        }
                    }
                }
            },

            onError: (errors: Record<string, string>): void => {
                {
                    // Erreur de validation classique (422) : on affiche le
                    // message réel du serveur plutôt qu'une confirmation.
                    const firstError = Object.values(errors)[0];

                    toast.error(
                        (typeof firstError === 'string' ? firstError : null) ??
                            "La vente n'a pas pu être enregistrée.",
                        { duration: 6000 },
                    );
                }
            },

            onFinish: (): void => {
                {
                    setLoading(false);
                }
            },
        };

        if (isNew) {
            {
                router.post(
                    store(),
                    {
                        sale_id: parseInt(currentData.sale_id),
                        invoice_item_id: invoiceItemId,
                        unit_count: newCount,
                        real_price: parseFloat(currentData.real_price),
                    },
                    options,
                );
            }
        }

        if (!isNew && saleItem) {
            {
                router.patch(
                    update(saleItem.id),
                    {
                        unit_count: newCount,
                        real_price: parseFloat(currentData.real_price),
                    },
                    options,
                );
            }
        }
    };

    const handleDelete = (): void => {
        if (!saleItem) {
            {
                return;
            }
        }

        setLoading(true);

        router.delete(destroy(saleItem.id), {
            preserveScroll: true,

            onSuccess: (): void => {
                {
                    toast.success('Supprimée');

                    if (onDelete) {
                        {
                            onDelete(saleItem.id);
                        }
                    }
                }
            },

            onFinish: (): void => {
                {
                    setLoading(false);
                }
            },
        });
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLElement>,
        type?: 'sale',
    ): void => {
        if (openSale) {
            {
                return;
            }
        }

        const isClearKey = e.key === 'Backspace' || e.key === 'Delete';

        if (isClearKey && type) {
            {
                e.preventDefault();

                if (type === 'sale' && data.sale_id !== '') {
                    {
                        handleDataChange({ sale_id: '' });
                    }
                }

                return;
            }
        }

        if (type && !openSale) {
            {
                const isCharacter =
                    e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

                if (isCharacter) {
                    {
                        setOpenSale(true);

                        return;
                    }
                }
            }
        }

        if (e.key === 'Enter') {
            {
                e.preventDefault();

                if (isReadyToSave(data)) {
                    {
                        submitSave(data);
                    }
                }
            }
        }

        // Navigation entre les cellules du tableau (flèches directionnelles).
        navigateToAdjacentCell(e);
    };

    return {
        data,
        handleDataChange,
        loading,
        openSale,
        setOpenSale,
        handleDelete,
        handleKeyDown,
        submitSave,
        isReadyToSave,
    };
}
