import { update } from '@/routes/usines/reception-records';
import type { ReceptionRecord } from '@/types/reception-record';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';

/**
 * Inactivity delay before automatically saving edits to a reception record.
 */
const AUTO_SAVE_DELAY = 700;

/** Retry delay when a request is already in flight. */
const AUTO_SAVE_RETRY_DELAY = 200;

interface UseReceptionRecordProps {
    usineId: number;
    record: ReceptionRecord;
}

interface ReceptionRecordData {
    weight: string;
    ttc: string;
    amount: string;
    margin_percentage: string;
    is_invoiced: boolean;
    invoice_reference: string;
}

function toFixedDecimal(value: string | number): string {
    const parsed = Number(String(value).replace(',', '.'));

    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

const createInitialData = (record: ReceptionRecord): ReceptionRecordData => {
    return {
        weight: toFixedDecimal(record.weight),
        ttc: toFixedDecimal(record.ttc),
        amount: toFixedDecimal(record.amount),
        margin_percentage: toFixedDecimal(record.margin_percentage),
        is_invoiced: record.is_invoiced,
        invoice_reference:
            record.invoice_reference !== null
                ? String(record.invoice_reference)
                : '',
    };
};

/**
 * Stable signature so only real changes are sent to the server.
 */
const toSignature = (data: ReceptionRecordData): string => {
    return JSON.stringify([
        toFixedDecimal(data.weight),
        toFixedDecimal(data.ttc),
        toFixedDecimal(data.amount),
        toFixedDecimal(data.margin_percentage),
        data.is_invoiced,
        data.invoice_reference.trim(),
    ]);
};

export function useReceptionRecord({
    usineId,
    record,
}: UseReceptionRecordProps) {
    const [data, setData] = useState<ReceptionRecordData>(() =>
        createInitialData(record),
    );
    const [loading, setLoading] = useState(false);

    const dataRef = useRef<ReceptionRecordData>(data);
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

    useEffect(() => {
        return () => {
            clearSaveTimer();
        };
    }, []);

    const normalizeData = (
        currentData: ReceptionRecordData,
    ): ReceptionRecordData => {
        return {
            ...currentData,
            weight: toFixedDecimal(currentData.weight),
            ttc: toFixedDecimal(currentData.ttc),
            amount: toFixedDecimal(currentData.amount),
            margin_percentage: toFixedDecimal(currentData.margin_percentage),
        };
    };

    const buildPayload = (currentData: ReceptionRecordData) => {
        return {
            session_id: record.session_id,
            weight: Number(currentData.weight) || 0,
            ttc: Number(currentData.ttc) || 0,
            amount: Number(currentData.amount) || 0,
            margin_percentage: Number(currentData.margin_percentage) || 0,
            is_invoiced: currentData.is_invoiced,
            invoice_reference:
                currentData.invoice_reference.trim() === ''
                    ? null
                    : Number(currentData.invoice_reference),
        };
    };

    const submitSave = (currentData: ReceptionRecordData) => {
        if (loadingRef.current) {
            pendingSaveRef.current = true;

            return;
        }

        clearSaveTimer();
        pendingSaveRef.current = false;
        loadingRef.current = true;
        setLoading(true);

        const signature = toSignature(currentData);

        router.patch(
            update({
                usine: usineId,
                receptionRecord: record.id,
            }).url,
            buildPayload(currentData),
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    savedSignatureRef.current = signature;
                },
                onError: () => {
                    toast.error("Impossible d'enregistrer la réception.");
                },
                onFinish: () => {
                    loadingRef.current = false;
                    setLoading(false);

                    if (pendingSaveRef.current) {
                        scheduleSave(AUTO_SAVE_RETRY_DELAY);
                    }
                },
            },
        );
    };

    const flushSave = (currentData = dataRef.current) => {
        clearSaveTimer();

        if (toSignature(currentData) === savedSignatureRef.current) {
            pendingSaveRef.current = false;

            return;
        }

        if (loadingRef.current) {
            pendingSaveRef.current = true;

            return;
        }

        submitSave(currentData);
    };

    const scheduleSave = (delay = AUTO_SAVE_DELAY) => {
        clearSaveTimer();
        saveTimerRef.current = setTimeout(() => {
            saveTimerRef.current = null;
            flushSave();
        }, delay);
    };

    const commit = () => {
        const normalized = normalizeData(dataRef.current);

        dataRef.current = normalized;
        setData(normalized);
        flushSave(normalized);
    };

    const handleDataChange = (updates: Partial<ReceptionRecordData>) => {
        const nextData = { ...dataRef.current, ...updates };

        dataRef.current = nextData;
        setData(nextData);
        scheduleSave();
    };

    const handleBlur = () => {
        commit();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter') {
            if (event.target instanceof HTMLInputElement) {
                event.preventDefault();
                commit();
            }

            return;
        }

        const isMovementKey = [
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
        ].includes(event.key);

        if (!isMovementKey) {
            return;
        }

        event.preventDefault();

        const currentCell = (event.target as HTMLElement).closest('td');

        if (!currentCell) {
            return;
        }

        const focusControl = (cell: Element | null): boolean => {
            if (!(cell instanceof HTMLElement)) {
                return false;
            }

            const target = cell.querySelector<HTMLElement>(
                'input:not(:disabled), button:not(:disabled), select:not(:disabled)',
            );

            if (!target) {
                return false;
            }

            target.focus();

            if (target instanceof HTMLInputElement) {
                target.select();
            }

            return true;
        };

        if (event.key === 'ArrowRight') {
            let cell = currentCell.nextElementSibling;

            while (cell) {
                if (focusControl(cell)) {
                    return;
                }

                cell = cell.nextElementSibling;
            }
        }

        if (event.key === 'ArrowLeft') {
            let cell = currentCell.previousElementSibling;

            while (cell) {
                if (focusControl(cell)) {
                    return;
                }

                cell = cell.previousElementSibling;
            }
        }

        if (event.key === 'ArrowDown') {
            focusControl(
                currentCell.parentElement?.nextElementSibling?.children[
                    currentCell.cellIndex
                ] ?? null,
            );
        }

        if (event.key === 'ArrowUp') {
            focusControl(
                currentCell.parentElement?.previousElementSibling?.children[
                    currentCell.cellIndex
                ] ?? null,
            );
        }
    };

    return {
        data,
        loading,
        handleDataChange,
        handleBlur,
        handleKeyDown,
    };
}
