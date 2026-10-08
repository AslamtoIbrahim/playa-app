import { useCallback, useEffect, useState } from 'react';

export type SessionMainTab = 'achats' | 'ventes';

export type SessionPurchaseTab = 'factures' | 'receipts' | 'ouvriers';

export interface SessionTabsState {
    main: SessionMainTab;
    purchase: SessionPurchaseTab;
}

export interface UseSessionTabsReturn extends SessionTabsState {
    setMainTab: (value: string) => void;
    setPurchaseTab: (value: string) => void;
}

const defaultTabs: SessionTabsState = {
    main: 'achats',
    purchase: 'factures',
};

const storagePrefix = 'playa:session-tabs:';

const isSessionMainTab = (value: unknown): value is SessionMainTab => {
    return value === 'achats' || value === 'ventes';
};

const isSessionPurchaseTab = (value: unknown): value is SessionPurchaseTab => {
    return value === 'factures' || value === 'receipts' || value === 'ouvriers';
};

const getStorageKey = (sessionId: number): string => {
    return `${storagePrefix}${sessionId}`;
};

const getDefaultTabs = (): SessionTabsState => {
    return { ...defaultTabs };
};

const readSessionTabs = (sessionId: number): SessionTabsState => {
    if (typeof window === 'undefined') {
        return getDefaultTabs();
    }

    try {
        const storedValue = window.localStorage.getItem(
            getStorageKey(sessionId),
        );

        if (!storedValue) {
            return getDefaultTabs();
        }

        const parsedValue: unknown = JSON.parse(storedValue);

        if (typeof parsedValue !== 'object' || parsedValue === null) {
            return getDefaultTabs();
        }

        const storedTabs = parsedValue as Record<string, unknown>;

        return {
            main: isSessionMainTab(storedTabs.main)
                ? storedTabs.main
                : defaultTabs.main,
            purchase: isSessionPurchaseTab(storedTabs.purchase)
                ? storedTabs.purchase
                : defaultTabs.purchase,
        };
    } catch {
        return getDefaultTabs();
    }
};

const writeSessionTabs = (sessionId: number, tabs: SessionTabsState): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(
            getStorageKey(sessionId),
            JSON.stringify(tabs),
        );
    } catch {
        // Storage may be unavailable (private browsing, quota, etc.).
    }
};

export function useSessionTabs(sessionId: number): UseSessionTabsReturn {
    const [tabs, setTabs] = useState<SessionTabsState>(() =>
        readSessionTabs(sessionId),
    );

    const setMainTab = useCallback((value: string): void => {
        if (!isSessionMainTab(value)) {
            return;
        }

        setTabs((currentTabs) => {
            if (currentTabs.main === value) {
                return currentTabs;
            }

            return { ...currentTabs, main: value };
        });
    }, []);

    const setPurchaseTab = useCallback((value: string): void => {
        if (!isSessionPurchaseTab(value)) {
            return;
        }

        setTabs((currentTabs) => {
            if (currentTabs.purchase === value) {
                return currentTabs;
            }

            return { ...currentTabs, purchase: value };
        });
    }, []);

    useEffect(() => {
        writeSessionTabs(sessionId, tabs);
    }, [sessionId, tabs]);

    return {
        ...tabs,
        setMainTab,
        setPurchaseTab,
    };
}
