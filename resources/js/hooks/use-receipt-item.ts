import { store, update } from '@/routes/receipts/items';
import { ReceiptItem } from '@/types/receipt-item';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

/**
 * Délai d'inactivité avant l'enregistrement automatique d'une modification.
 * Assez long pour ne pas déclencher une requête à chaque frappe, assez court
 * pour qu'aucune saisie ne soit perdue si l'utilisateur oublie « Entrée ».
 */
const AUTO_SAVE_DELAY = 700;

/** Délai de reprise quand une requête est déjà en vol. */
const AUTO_SAVE_RETRY_DELAY = 200;

interface UseReceiptItemProps {
    receiptId: number;
    item?: ReceiptItem;
    isNew?: boolean;
}

interface ReceiptItemData {
    item_id: number | string;
    unit_count: number | string;
    real_price: number | string;
    box: number | string;
}

const createEmptyData = (): ReceiptItemData => {
    return {
        item_id: '',
        unit_count: '',
        real_price: '',
        box: '',
    };
};

/**
 * Signature stable d'une ligne : elle permet de ne renvoyer vers le serveur
 * que les réels changements, quelle que soit la façon dont le navigateur
 * sérialise les champs numériques.
 */
const toSignature = (payload: ReceiptItemData): string => {
    return JSON.stringify([
        String(payload.item_id),
        String(payload.unit_count),
        String(payload.real_price),
        String(payload.box),
    ]);
};

export function useReceiptItem({ receiptId, item, isNew }: UseReceiptItemProps) {
    const [loading, setLoading] = useState(false);

    const [openItem, setOpenItem] = useState(false);

    const [data, setData] = useState<ReceiptItemData>({
        item_id: item?.item_id || '',
        unit_count: item?.unit_count || '',
        real_price: item?.real_price || '',
        box: item?.box || '',
    });

    /*
     * Miroirs de l'état : les callbacks déclenchés plus tard (debounce, blur)
     * lisent toujours la dernière valeur saisie, sans dépendre du rendu qui les
     * a créés.
     */
    const dataRef = useRef<ReceiptItemData>(data);
    const loadingRef = useRef(loading);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedSignatureRef = useRef<string>(toSignature(data));
    const pendingSaveRef = useRef(false);

    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    const clearSaveTimer = () => {
        if (saveTimerRef.current !== null) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
    };

    // Une ligne supprimée pendant qu'une saisie est en attente : on n'enregistre plus.
    useEffect(() => {
        return () => {
            clearSaveTimer();
        };
    }, []);

    // حساب المجموع مباشرة يدعم القيم السالبة والموجبة
    const rowTotal = Number(data.unit_count || 0) * Number(data.real_price || 0);

    const buildPayload = (currentData: ReceiptItemData) => {
        return {
            ...currentData,
            // تحويل القيم الفارغة إلى null لكي يقبلها الـ Backend
            item_id: currentData.item_id || null,
            box: currentData.box || 0,
            _method: isNew ? 'POST' : 'PATCH',
        };
    };

    const handleDataChange = (updates: Partial<ReceiptItemData>) => {
        const newData = { ...dataRef.current, ...updates };

        /*
         * Le miroir est mis à jour immédiatement : les enregistrements différés
         * (debounce, blur) lisent ainsi toujours la dernière saisie.
         */
        dataRef.current = newData;
        setData(newData);

        // Toute modification est enregistrée, sans attendre la touche Entrée.
        scheduleSave();
    };

    const isReadyToSave = (currentData = dataRef.current) => {
        if (isNew) {
            // التحقق فقط من الكمية والسعر (يجب ألا يكونا صفراً)
            const hasValidPrice = currentData.real_price !== '' && Number(currentData.real_price) !== 0;

            const hasValidQuantity = currentData.unit_count !== '' && Number(currentData.unit_count) !== 0;

            return hasValidPrice && hasValidQuantity;
        }

        return true;
    };

    const submitSave = (currentData = dataRef.current) => {
        if (!isReadyToSave(currentData)) {
            return;
        }

        if (loadingRef.current) {
            // Requête déjà en vol : la saisie repartira dès qu'elle se termine,
            // ce qui évite de perdre une frappe faite pendant l'enregistrement.
            pendingSaveRef.current = !isNew;

            return;
        }

        clearSaveTimer();
        pendingSaveRef.current = false;

        // La signature mémorise ce qui part vers le serveur : un flush sans
        // changement réel n'émet donc aucune requête inutile.
        savedSignatureRef.current = toSignature(currentData);

        loadingRef.current = true;
        setLoading(true);

        const url = isNew
            ? store(receiptId)
            : update({ receipt: receiptId, item: item!.id });

        router.post(url, buildPayload(currentData), {
            preserveScroll: true,
            onSuccess: () => {
                if (isNew) {
                    const emptyData = createEmptyData();

                    dataRef.current = emptyData;
                    setData(emptyData);
                }
            },
            onFinish: () => {
                loadingRef.current = false;
                setLoading(false);

                if (pendingSaveRef.current) {
                    scheduleSave(AUTO_SAVE_RETRY_DELAY);
                }
            },
        });
    };

    /**
     * Enregistre immédiatement la saisie en attente : utilisé par le debounce,
     * la perte de focus et la touche Entrée.
     */
    const flushSave = () => {
        clearSaveTimer();

        /*
         * La ligne « nouvelle » reste explicite (Entrée ou bouton ✓) : sinon
         * chaque frappe créerait une ligne vide.
         */
        if (isNew || !item?.id) {
            return;
        }

        const currentData = dataRef.current;

        if (toSignature(currentData) === savedSignatureRef.current) {
            pendingSaveRef.current = false;

            return;
        }

        if (loadingRef.current) {
            pendingSaveRef.current = true;

            return;
        }

        pendingSaveRef.current = false;

        submitSave(currentData);
    };

    const scheduleSave = (delay = AUTO_SAVE_DELAY) => {
        if (isNew) {
            return;
        }

        clearSaveTimer();

        saveTimerRef.current = setTimeout(() => {
            saveTimerRef.current = null;
            flushSave();
        }, delay);
    };

    // Quitter une cellule enregistre tout de suite, sans attendre le debounce.
    const handleBlur = () => {
        flushSave();
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLElement>,
        type?: 'item',
    ) => {
        if (openItem) {
            return;
        }

        if (type && !openItem) {
            const isCharacter = e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

            if (isCharacter) {
                setOpenItem(true);

                return;
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();

            if (isNew) {
                submitSave();
            } else {
                // Sur une ligne existante, Entrée valide sans attendre
                // et sans réémettre si rien n'a changé.
                flushSave();
            }
        }

        const isMovementKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

        if (isMovementKey) {
            e.preventDefault();

            const currentCell = (e.target as HTMLElement).closest('td');

            if (!currentCell) {
                return;
            }

            const focusElement = (el: Element | null) => {
                const target = el?.querySelector('input, button, select') as HTMLElement;

                if (target) {
                    target.focus();

                    if (target instanceof HTMLInputElement) {
                        target.select();
                    }
                }
            };

            if (e.key === 'ArrowRight') {
                focusElement(currentCell.nextElementSibling);
            }

            if (e.key === 'ArrowLeft') {
                focusElement(currentCell.previousElementSibling);
            }

            if (e.key === 'ArrowDown') {
                focusElement(currentCell.parentElement?.nextElementSibling?.children[currentCell.cellIndex] || null);
            }

            if (e.key === 'ArrowUp') {
                focusElement(currentCell.parentElement?.previousElementSibling?.children[currentCell.cellIndex] || null);
            }
        }
    };

    return {
        data,
        rowTotal,
        handleDataChange,
        loading,
        openItem,
        setOpenItem,
        isReadyToSave,
        submitSave,
        handleKeyDown,
        handleBlur,
    };
}