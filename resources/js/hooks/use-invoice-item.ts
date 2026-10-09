import { store, update } from '@/routes/invoices/items';
import { InvoiceItem } from '@/types/invoice-item';
import { router } from '@inertiajs/react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

/**
 * Délai d'inactivité avant l'enregistrement automatique d'une modification.
 * Assez long pour ne pas déclencher une requête à chaque frappe, assez court
 * pour qu'aucune saisie ne soit perdue si l'utilisateur oublie « Entrée ».
 */
const AUTO_SAVE_DELAY = 700;
const NEW_ITEM_AUTO_SAVE_DELAY = 3000;

/** Délai de reprise quand une requête est déjà en vol. */
const AUTO_SAVE_RETRY_DELAY = 200;

interface UseInvoiceItemProps {
    invoiceId: number;
    item?: InvoiceItem;
    isNew?: boolean;
}

interface InvoiceItemData {
    boat_id: number | string;
    item_id: number | string;
    unit_count: number | string;
    unit_price: number | string;
    unit: string;
    box: number | string;
    weight: number | string;
}

const createEmptyData = (): InvoiceItemData => {
    return {
        boat_id: '',
        item_id: '',
        unit_count: '',
        unit_price: '',
        unit: 'caisse',
        box: '',
        weight: '',
    };
};

/**
 * Signature stable d'une ligne : elle permet de ne renvoyer vers le serveur
 * que les réels changements, quelle que soit la façon dont le navigateur
 * sérialise les champs numériques.
 */
const toSignature = (payload: InvoiceItemData): string => {
    return JSON.stringify([
        String(payload.boat_id),
        String(payload.item_id),
        String(payload.unit_count),
        String(payload.unit_price),
        String(payload.unit),
        String(payload.box),
        String(payload.weight),
    ]);
};

export function useInvoiceItem({
    invoiceId,
    item,
    isNew,
}: UseInvoiceItemProps) {
    const [loading, setLoading] = useState(false);
    const [openBoat, setOpenBoat] = useState(false);
    const [openItem, setOpenItem] = useState(false);

    const [data, setData] = useState<InvoiceItemData>({
        boat_id: item?.boat_id || '',
        item_id: item?.item_id || '',
        unit_count: item?.unit_count || '',
        unit_price: item?.unit_price || '',
        unit: item?.unit || 'caisse',
        box: item?.box || '',
        weight: item?.weight || '',
    });

    /*
     * Miroirs de l'état : les callbacks déclenchés plus tard (debounce,
     * blur) lisent toujours la dernière valeur saisie, sans dépendre du rendu
     * qui les a créés.
     */
    const dataRef = useRef<InvoiceItemData>(data);
    const loadingRef = useRef(loading);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedSignatureRef = useRef<string>(toSignature(data));
    const pendingSaveRef = useRef(false);
    const flushSaveRef = useRef<() => void>(() => {});
    const saveDraftOnLeaveRef = useRef<() => void>(() => {});

    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    const clearSaveTimer = () => {
        if (saveTimerRef.current !== null) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
    };

    // Un svelte supprimé pendant qu'une saisie est en attente : on ne saves plus.
    useEffect(() => {
        return () => {
            clearSaveTimer();
        };
    }, []);

    useEffect(() => {
        if (!isNew) {
            return;
        }

        const saveDraftOnLeave = () => saveDraftOnLeaveRef.current();
        const removeBeforeListener = router.on('before', saveDraftOnLeave);

        window.addEventListener('pagehide', saveDraftOnLeave);

        return () => {
            removeBeforeListener();
            window.removeEventListener('pagehide', saveDraftOnLeave);
        };
    }, [isNew]);

    const buildPayload = (currentData: InvoiceItemData) => {
        return {
            ...currentData,
            box:
                currentData.unit === 'caisse'
                    ? currentData.unit_count
                    : currentData.box,
            weight: currentData.weight.toString(),
            _method: isNew ? 'POST' : 'PATCH',
        };
    };

    const count = Number(data.unit_count) || 0;

    const amount = count * Number(data.unit_price);

    // Derived Logic for Box (Computed based on unit)
    const displayBox = data.unit === 'caisse' ? data.unit_count : data.box;

    const handleDataChange = (updates: Partial<InvoiceItemData>) => {
        const newData = { ...dataRef.current, ...updates };

        // Logic for unit_count change
        if (Object.prototype.hasOwnProperty.call(updates, 'unit_count')) {
            {
                const newCount = Number(updates.unit_count) || 0;

                if (newData.unit === 'caisse') {
                    {
                        newData.weight = (newCount * 21).toString();
                        newData.box = newCount.toString();
                    }
                } else {
                    {
                        newData.weight = newCount.toString();
                    }
                }
            }
        }

        // Logic for unit change
        if (Object.prototype.hasOwnProperty.call(updates, 'unit')) {
            {
                const currentCount = Number(newData.unit_count) || 0;

                newData.weight =
                    newData.unit === 'caisse'
                        ? (currentCount * 21).toString()
                        : currentCount.toString();
            }
        }

        /*
         * Le miroir est mis à jour immédiatement : les enregistrements
         * différés (debounce, blur) lisent ainsi toujours la dernière saisie.
         */
        dataRef.current = newData;
        setData(newData);

        // Les lignes existantes et les lignes nouvelles sont enregistrées
        // après une période d'inactivité.
        scheduleSave();
    };

    const hasDataToSave = (currentData = dataRef.current) =>
        currentData.boat_id !== '' ||
        currentData.item_id !== '' ||
        String(currentData.unit_count).trim() !== '' ||
        String(currentData.unit_price).trim() !== '' ||
        currentData.unit !== 'caisse' ||
        String(currentData.box).trim() !== '' ||
        String(currentData.weight).trim() !== '';

    const isReadyToSave = (currentData = dataRef.current) => {
        if (isNew) {
            {
                return (
                    currentData.boat_id !== '' &&
                    currentData.item_id !== '' &&
                    Number(currentData.unit_price) > 0 &&
                    Number(currentData.unit_count) > 0
                );
            }
        }

        return true;
    };

    const submitSave = (currentData = dataRef.current) => {
        if (isNew ? !hasDataToSave(currentData) : !isReadyToSave(currentData)) {
            {
                return;
            }
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
            ? store(invoiceId)
            : update({ invoice: invoiceId, item: item!.id });

        router.post(url, buildPayload(currentData), {
            preserveScroll: true,
            onSuccess: () => {
                if (isNew) {
                    {
                        const emptyData = createEmptyData();

                        dataRef.current = emptyData;
                        savedSignatureRef.current = toSignature(emptyData);
                        setData(emptyData);
                    }
                }
            },
            onFinish: () => {
                loadingRef.current = false;
                setLoading(false);

                if (pendingSaveRef.current) {
                    {
                        scheduleSave(AUTO_SAVE_RETRY_DELAY);
                    }
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

        if (!isNew && !item?.id) {
            {
                return;
            }
        }

        const currentData = dataRef.current;

        if (isNew ? !hasDataToSave(currentData) : !isReadyToSave(currentData)) {
            {
                pendingSaveRef.current = false;

                return;
            }
        }

        if (toSignature(currentData) === savedSignatureRef.current) {
            {
                pendingSaveRef.current = false;

                return;
            }
        }

        if (loadingRef.current) {
            {
                pendingSaveRef.current = true;

                return;
            }
        }

        pendingSaveRef.current = false;

        submitSave(currentData);
    };

    const scheduleSave = (delay = AUTO_SAVE_DELAY) => {
        if (isNew && !hasDataToSave()) {
            clearSaveTimer();

            {
                return;
            }
        }

        clearSaveTimer();

        saveTimerRef.current = setTimeout(() => {
            saveTimerRef.current = null;
            flushSave();
        }, isNew ? NEW_ITEM_AUTO_SAVE_DELAY : delay);
    };

    const saveDraftOnLeave = () => {
        if (!isNew) {
            flushSaveRef.current();

            return;
        }

        clearSaveTimer();

        const currentData = dataRef.current;

        if (
            !hasDataToSave(currentData) ||
            toSignature(currentData) === savedSignatureRef.current ||
            loadingRef.current
        ) {
            return;
        }

        const token = document.querySelector<HTMLMetaElement>(
            'meta[name="csrf-token"]',
        )?.content;

        if (!token) {
            return;
        }

        const formData = new FormData();

        Object.entries(buildPayload(currentData)).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
        formData.append('_token', token);

        if (navigator.sendBeacon?.(store(invoiceId), formData)) {
            savedSignatureRef.current = toSignature(currentData);
        } else {
            void fetch(store(invoiceId), {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                keepalive: true,
                headers: {
                    Accept: 'text/html',
                    'X-CSRF-TOKEN': token,
                },
            })
                .then((response) => {
                    if (response.ok) {
                        savedSignatureRef.current = toSignature(currentData);
                    } else {
                        console.error(
                            'Unable to save the invoice item before leaving.',
                            response.status,
                        );
                    }
                })
                .catch((error: unknown) => {
                    console.error(
                        'Unable to save the invoice item before leaving.',
                        error,
                    );
                });
        }
    };

    flushSaveRef.current = flushSave;
    saveDraftOnLeaveRef.current = saveDraftOnLeave;

    // Existing rows save on blur; new-row typing is left to the longer debounce.
    const handleBlur = () => {
        if (!isNew) {
            flushSave();
        }
    };

    const handleKeyDown = (
        e: KeyboardEvent<HTMLElement>,
        type?: 'boat' | 'item',
    ) => {
        if (openBoat || openItem) {
            {
                return;
            }
        }

        const isClearKey = e.key === 'Backspace' || e.key === 'Delete';

        if (isClearKey && type) {
            {
                e.preventDefault();

                if (type === 'boat' && data.boat_id !== '') {
                    {
                        handleDataChange({ boat_id: '' });
                    }
                }

                if (type === 'item' && data.item_id !== '') {
                    {
                        handleDataChange({ item_id: '' });
                    }
                }

                return;
            }
        }

        if (type && !openBoat && !openItem) {
            {
                const isCharacter =
                    e.key.length === 1 && e.key.match(/[a-z0-9\u0600-\u06FF]/i);

                if (isCharacter) {
                    {
                        type === 'boat' ? setOpenBoat(true) : setOpenItem(true);

                        return;
                    }
                }
            }
        }

        if (e.key === 'Enter') {
            {
                e.preventDefault();

                if (isNew) {
                    {
                        submitSave();
                    }
                } else {
                    {
                        // Sur un svelte existant, Entrée valide sans attendre
                        // et sans réémettre si rien n'a changé.
                        flushSave();
                    }
                }
            }
        }

        const isMovementKey = [
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
        ].includes(e.key);

        if (isMovementKey) {
            {
                e.preventDefault();

                const currentCell = (e.target as HTMLElement).closest('td');

                if (!currentCell) {
                    {
                        return;
                    }
                }

                const focusElement = (el: Element | null) => {
                    const target = el?.querySelector(
                        'input, button, select',
                    ) as HTMLElement;

                    if (target) {
                        {
                            target.focus();

                            if (target instanceof HTMLInputElement) {
                                {
                                    target.select();
                                }
                            }
                        }
                    }
                };

                if (e.key === 'ArrowRight') {
                    {
                        focusElement(currentCell.nextElementSibling);
                    }
                }

                if (e.key === 'ArrowLeft') {
                    {
                        focusElement(currentCell.previousElementSibling);
                    }
                }

                if (e.key === 'ArrowDown') {
                    {
                        focusElement(
                            currentCell.parentElement?.nextElementSibling
                                ?.children[currentCell.cellIndex] || null,
                        );
                    }
                }

                if (e.key === 'ArrowUp') {
                    {
                        focusElement(
                            currentCell.parentElement?.previousElementSibling
                                ?.children[currentCell.cellIndex] || null,
                        );
                    }
                }
            }
        }
    };

    return {
        data,
        handleDataChange,
        loading,
        openBoat,
        setOpenBoat,
        openItem,
        setOpenItem,
        weight: data.weight,
        amount,
        displayBox,
        isReadyToSave,
        submitSave,
        handleKeyDown,
        handleBlur,
    };
}
